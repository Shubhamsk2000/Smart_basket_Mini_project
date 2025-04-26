#include <WebServer.h>
#include <WiFi.h>
#include <esp32cam.h>

// --- WiFi Credentials ---
// const char* WIFI_SSID = "moto";
// const char* WIFI_PASS = "shubham1318";
const char* WIFI_SSID = "Boyzz";
const char* WIFI_PASS = "Comfort99";
// --- End WiFi Credentials ---

WebServer server(80);

// --- Pin Definitions ---
const int buzzerPin = 12; // Buzzer connected to GPIO 12
const int irSensorPin = 15; // IR Sensor connected to GPIO 15
// --- End Pin Definitions ---

// --- Camera Resolutions ---
static auto loRes = esp32cam::Resolution::find(320, 240);
static auto midRes = esp32cam::Resolution::find(350, 530);
static auto hiRes = esp32cam::Resolution::find(800, 600);
// --- End Camera Resolutions ---

// --- Function Declarations ---
void serveJpgConditional();
void handleJpgLo();
void handleJpgHi();
void handleJpgMid();
void handleBeep();
// --- End Function Declarations ---


// Function to serve JPG IF IR sensor detects an object
void serveJpgConditional() {
  // Read IR Sensor State (Assuming Active LOW sensor: LOW means object detected)
  int irState = digitalRead(irSensorPin);

  if (irState == HIGH) { // HIGH means NO object detected
    Serial.println("IR: No object detected.");
    server.send(204, "text/plain", "No object"); // Send "No Content" status
    return; // Stop processing here
  }

  // --- Object IS detected (irState == LOW) ---
  Serial.println("IR: Object detected! Capturing image...");
  auto frame = esp32cam::capture();
  if (frame == nullptr) {
    Serial.println("CAPTURE FAIL");
    server.send(503, "", ""); // Service Unavailable
    return;
  }
  Serial.printf("CAPTURE OK %dx%d %db\n", frame->getWidth(), frame->getHeight(),
                static_cast<int>(frame->size()));

  server.setContentLength(frame->size());
  server.send(200, "image/jpeg"); // Send OK status with image
  WiFiClient client = server.client();
  frame->writeTo(client);
}

// Request handler for low-resolution image
void handleJpgLo() {
  if (!esp32cam::Camera.changeResolution(loRes)) {
    Serial.println("SET-LO-RES FAIL");
  }
  serveJpgConditional(); // Use the conditional serving function
}

// Request handler for high-resolution image
void handleJpgHi() {
  // NOTE: Resolution is set in setup() and might not need changing here
  // if you only use hi-res. Included for consistency.
  // if (!esp32cam::Camera.changeResolution(hiRes)) {
  //   Serial.println("SET-HI-RES FAIL");
  // }
  serveJpgConditional(); // Use the conditional serving function
}

// Request handler for medium-resolution image
void handleJpgMid() {
  if (!esp32cam::Camera.changeResolution(midRes)) {
    Serial.println("SET-MID-RES FAIL");
  }
  serveJpgConditional(); // Use the conditional serving function
}

// Request handler to trigger the buzzer
void handleBeep() {
  Serial.println("Activating buzzer...");
  digitalWrite(buzzerPin, HIGH); // Turn buzzer ON
  delay(150);                    // Beep duration (adjust as needed)
  digitalWrite(buzzerPin, LOW);  // Turn buzzer OFF
  server.send(200, "text/plain", "Beep OK"); // Respond to Python
}


void setup() {
  Serial.begin(115200);
  Serial.println("\nStarting ESP32-CAM QR Scanner with IR...");

  // --- Initialize Pins ---
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW); // Ensure buzzer is OFF initially

  // Initialize IR sensor pin as input with pull-up resistor
  // (Pull-up is common for active-low IR sensors - keeps input HIGH when no object)
  // If your sensor is active-high, use just INPUT.
  pinMode(irSensorPin, INPUT_PULLUP);
  Serial.println("Pins Initialized (Buzzer: 12, IR: 13)");
  // --- End Initialize Pins ---

  // --- Initialize Camera ---
  {
    using namespace esp32cam;
    Config cfg;
    cfg.setPins(pins::AiThinker); // IMPORTANT: Make sure this matches your board
    cfg.setResolution(hiRes);     // Start with high resolution
    cfg.setBufferCount(2);
    cfg.setJpeg(80);

    bool ok = Camera.begin(cfg);
    Serial.println(ok ? "CAMERA OK" : "CAMERA FAIL");
    if (!ok) {
      Serial.println("Halting due to camera failure.");
      while(true) delay(1000); // Stop here if camera fails
    }
  }
  // --- End Initialize Camera ---

  // --- Connect to WiFi ---
  Serial.print("Connecting to WiFi: ");
  Serial.print(WIFI_SSID);
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int connect_tries = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    connect_tries++;
    if (connect_tries > 30) { // Timeout after ~15 seconds
        Serial.println("\nWiFi Connection Failed! Please check credentials or network.");
        // Optional: Reboot or enter a safe mode
        ESP.restart();
    }
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("ESP32 IP Address: http://");
  Serial.println(WiFi.localIP());
  // --- End Connect to WiFi ---

  // --- Setup Web Server Routes ---
  server.on("/cam-lo.jpg", HTTP_GET, handleJpgLo);
  server.on("/cam-hi.jpg", HTTP_GET, handleJpgHi); // Most likely used by Python
  server.on("/cam-mid.jpg", HTTP_GET, handleJpgMid);
  server.on("/beep", HTTP_GET, handleBeep);         // New endpoint for buzzer

  server.begin();
  Serial.println("Web Server Started.");
  Serial.println("Waiting for IR detection or requests...");
  // --- End Setup Web Server Routes ---
}

void loop() {
  server.handleClient();
  // No delay needed here, handleClient takes care of processing
}