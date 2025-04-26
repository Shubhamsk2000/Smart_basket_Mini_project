import cv2
import numpy as np
import pyzbar.pyzbar as pyzbar
import requests
import time

ESP32_BASE_URL = 'http://192.168.204.73'
ESP32_CAM_URL = f'{ESP32_BASE_URL}/cam-hi.jpg'
ESP32_BEEP_URL = f'{ESP32_BASE_URL}/beep'
NODE_BACKEND_BASE_URL = 'http://localhost:5001/api/'
DEBOUNCE_SECONDS = 3.0
REQUEST_TIMEOUT = 5
IR_CHECK_INTERVAL = 0.1

font = cv2.FONT_HERSHEY_PLAIN
cv2.namedWindow("ESP32 CAM QR Scanner", cv2.WINDOW_AUTOSIZE)

last_sent_qr_data = ""
last_send_time = 0

print(f"Attempting to stream from: {ESP32_CAM_URL} (conditional on IR sensor)")
print(f"Will trigger beep at: {ESP32_BEEP_URL}")
print(f"Sending detected barcodes to: {NODE_BACKEND_BASE_URL}<barcode>")
print(f"Debounce time: {DEBOUNCE_SECONDS} seconds")

while True:
    frame_to_display = None
    try:
        try:
            img_resp = requests.get(ESP32_CAM_URL, timeout=REQUEST_TIMEOUT)
            img_resp.raise_for_status()

            if img_resp.status_code == 200:
                imgnp = np.array(bytearray(img_resp.content), dtype=np.uint8)
                frame = cv2.imdecode(imgnp, -1)
                if frame is None:
                    print("Error: Failed to decode image frame.")
                    time.sleep(0.5)
                    continue
                frame_to_display = frame.copy()
                print("IR Check: Object detected, image received.")
            elif img_resp.status_code == 204:
                frame_to_display = None
                time.sleep(IR_CHECK_INTERVAL)
                continue
            else:
                print(f"Warning: Received unexpected status code {img_resp.status_code} from ESP32.")
                frame_to_display = None
                time.sleep(1)
                continue
        except requests.exceptions.ConnectionError as e:
            print(f"!! Network Error connecting to ESP32 ({ESP32_CAM_URL}): {e}")
            print("   Check ESP32 IP address and Wi-Fi connection.")
            frame_to_display = None
            time.sleep(2)
            continue
        except requests.exceptions.Timeout:
            print(f"!! Timeout connecting to ESP32 ({ESP32_CAM_URL}).")
            frame_to_display = None
            time.sleep(1)
            continue
        except requests.exceptions.RequestException as e:
            print(f"!! Error during request to ESP32 ({ESP32_CAM_URL}): {e}")
            frame_to_display = None
            time.sleep(1)
            continue

        if frame_to_display is not None:
            decodedObjects = pyzbar.decode(frame)
            detected_qr_data = None

            for obj in decodedObjects:
                try:
                    qr_data_str = obj.data.decode('utf-8').strip()
                    if qr_data_str:
                        detected_qr_data = qr_data_str
                        print(f"Detected: Type={obj.type}, Data='{qr_data_str}'")

                        points = obj.polygon
                        if len(points) > 4:
                            hull = cv2.convexHull(np.array([point for point in points], dtype=np.float32))
                            cv2.polylines(frame_to_display, [hull], True, (0,255,0), 2)
                        else:
                            cv2.polylines(frame_to_display, [np.array(points, dtype=np.int32)], True, (0,255,0), 2)
                        rect = obj.rect
                        cv2.putText(frame_to_display, qr_data_str, (rect.left, rect.top - 10), font, 1.2, (0, 0, 255), 2)

                        break
                    else:
                        print("Detected empty QR/barcode data. Ignoring.")
                except UnicodeDecodeError:
                    print(f"Warning: Could not decode QR data as UTF-8: {obj.data}")
                    rect = obj.rect
                    cv2.rectangle(frame_to_display, (rect.left, rect.top), (rect.left + rect.width, rect.top + rect.height), (0, 0, 255), 2)
                    cv2.putText(frame_to_display, "Undecodable", (rect.left, rect.top - 10), font, 1, (0, 0, 255), 1)
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

                        try:
                            print(f"--> Triggering buzzer at {ESP32_BEEP_URL}")
                            beep_resp = requests.get(ESP32_BEEP_URL, timeout=REQUEST_TIMEOUT / 2)
                            beep_resp.raise_for_status()
                            print(f"    Buzzer response: {beep_resp.status_code}")
                        except requests.exceptions.RequestException as beep_err:
                            print(f"!! Warning: Failed to trigger ESP32 buzzer: {beep_err}")
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
                else:
                    pass

        if frame_to_display is not None:
            cv2.imshow("ESP32 CAM QR Scanner", frame_to_display)
        else:
            placeholder_frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(placeholder_frame, "Waiting for object...", (50, 240), font, 1.5, (255, 255, 255), 1)
            cv2.imshow("ESP32 CAM QR Scanner", placeholder_frame)

    except cv2.error as e:
        print(f"!! OpenCV Error: {e}")
        time.sleep(1)
    except Exception as e:
        print(f"!! An unexpected error occurred in the main loop: {e}")
        if isinstance(e, KeyboardInterrupt):
            print("\nCtrl+C detected. Exiting...")
            break
        time.sleep(1)

    key = cv2.waitKey(1)
    if key == 27:
        print("ESC key pressed. Exiting...")
        break

cv2.destroyAllWindows()
print("Scanner stopped.")
