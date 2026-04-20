#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <SparkFun_APDS9960.h>

// Configurações WiFi
const char* ssid = "Ap17";
const char* password = "HsxFs7_J3W";
const char* serverBase = "http://192.168.1.8:3001/api/bacia";

// Pinos e Sensor
#define APDS9960_INT 19
SparkFun_APDS9960 apds = SparkFun_APDS9960();
volatile bool isr_flag = false;

void IRAM_ATTR interruptRoutine() {
  isr_flag = true;
}

void setup() {
  Serial.begin(115200);
  pinMode(APDS9960_INT, INPUT_PULLUP);

  // Conexão WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Conectado!");

  // Inicialização do Sensor
  if (apds.init() && apds.enableGestureSensor(true)) {
    Serial.println("APDS-9960 pronto!");
  } else {
    Serial.println("Erro no sensor!");
    while(1);
  }
  attachInterrupt(digitalPinToInterrupt(APDS9960_INT), interruptRoutine, FALLING);
}

void enviarComando(String endpoint) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverBase) + endpoint;
    http.begin(url);
    int httpResponseCode = http.POST("");
    Serial.printf("Gesto -> %s | Status: %d\n", endpoint.c_str(), httpResponseCode);
    http.end();
  }
}

void loop() {
  if (isr_flag) {
    detachInterrupt(digitalPinToInterrupt(APDS9960_INT));
    
    if (apds.isGestureAvailable()) {
      switch (apds.readGesture()) {
        case DIR_RIGHT: enviarComando("/proxima");  break;
        case DIR_LEFT:  enviarComando("/anterior"); break;
        case DIR_UP:    enviarComando("/info");     break; // Reforça bacia atual
        case DIR_DOWN:  enviarComando("/home");     break; // Volta ao início
      }
    }
    
    isr_flag = false;
    attachInterrupt(digitalPinToInterrupt(APDS9960_INT), interruptRoutine, FALLING);
  }
}