import cv2
import numpy as np
import pyzbar.pyzbar as pyzbar
import urllib.request
import requests  
import time      

ESP32_CAM_URL = 'http://192.168.84.73/cam-hi.jpg'
NODE_BACKEND_BASE_URL = 'http://localhost:5001/api/'
DEBOUNCE_SECONDS = 3.0
REQUEST_TIMEOUT = 5

font = cv2.FONT_HERSHEY_PLAIN
cv2.namedWindow("ESP32 CAM QR Scanner", cv2.WINDOW_AUTOSIZE)

last_sent_qr_data = ""
last_send_time = 0

print(f"Attempting to stream from: {ESP32_CAM_URL}")
print(f"Sending detected barcodes to: {NODE_BACKEND_BASE_URL}<barcode>")
print(f"Debounce time: {DEBOUNCE_SECONDS} seconds")

while True:
    try:
        img_resp = urllib.request.urlopen(ESP32_CAM_URL, timeout=REQUEST_TIMEOUT)
        imgnp = np.array(bytearray(img_resp.read()), dtype=np.uint8)
        frame = cv2.imdecode(imgnp, -1)

        if frame is None:
            print("Error: Failed to decode image frame.")
            time.sleep(1)
            continue

        decodedObjects = pyzbar.decode(frame)
        detected_qr_data = None

        for obj in decodedObjects:
            try:
                qr_data_str = obj.data.decode('utf-8').strip()

                if qr_data_str:
                    detected_qr_data = qr_data_str
                    print(f"Detected: Type={obj.type}, Data='{qr_data_str}'")

                    points = obj.polygon
                    if len(points) > 4 :
                      hull = cv2.convexHull(np.array([point for point in points], dtype=np.float32))
                      cv2.polylines(frame, [hull], True, (0,255,0), 2)
                    else :
                      cv2.polylines(frame, [np.array(points, dtype=np.int32)], True, (0,255,0), 2)

                    rect = obj.rect
                    cv2.putText(frame, qr_data_str, (rect.left, rect.top - 10), font, 1.2, (0, 0, 255), 2)
                    break
                else:
                    print("Detected empty QR/barcode data. Ignoring.")

            except UnicodeDecodeError:
                print(f"Warning: Could not decode QR data as UTF-8: {obj.data}")
                rect = obj.rect
                cv2.rectangle(frame, (rect.left, rect.top), (rect.left + rect.width, rect.top + rect.height), (0, 0, 255), 2)
                cv2.putText(frame, "Undecodable", (rect.left, rect.top - 10), font, 1, (0, 0, 255), 1)
                continue

        if detected_qr_data:
            current_time = time.time()
            if detected_qr_data != last_sent_qr_data or (current_time - last_send_time > DEBOUNCE_SECONDS):
                target_url = f"{NODE_BACKEND_BASE_URL}{detected_qr_data}"
                print(f"SENDING POST request for barcode: '{detected_qr_data}' to {target_url}")

                try:
                    headers = {'Content-Type': 'application/json'}
                    response = requests.post(target_url, headers=headers, timeout=REQUEST_TIMEOUT)
                    response.raise_for_status()

                    print(f"--> Success! Backend response: {response.status_code} - {response.text}")
                    last_sent_qr_data = detected_qr_data
                    last_send_time = current_time

                except requests.exceptions.HTTPError as http_err:
                    print(f"!! HTTP Error sending POST: {http_err}")
                    if http_err.response.status_code == 404:
                         print(f"   Backend indicated product not found for barcode: {detected_qr_data}")
                         last_sent_qr_data = detected_qr_data
                         last_send_time = current_time
                    else:
                         print(f"   Backend returned error status: {http_err.response.status_code}")

                except requests.exceptions.RequestException as e:
                    print(f"!! Network/Request Error sending POST: {e}")

                except Exception as e:
                     print(f"!! An unexpected error occurred during sending: {e}")

        cv2.imshow("ESP32 CAM QR Scanner", frame)

    except urllib.error.URLError as e:
        print(f"!! Network Error fetching image from ESP32 ({ESP32_CAM_URL}): {e}")
        print("   Check ESP32 IP address and Wi-Fi connection.")
        time.sleep(2)
    except cv2.error as e:
        print(f"!! OpenCV Error processing image: {e}")
        time.sleep(1)
    except Exception as e:
        print(f"!! An unexpected error occurred in the main loop: {e}")
        if isinstance(e, KeyboardInterrupt):
            print("\nCtrl+C detected. Exiting...")
            break
        time.sleep(1)

    key = cv2.waitKey(50)
    if key == 27:
        print("ESC key pressed. Exiting...")
        break

cv2.destroyAllWindows()
print("Scanner stopped.")
