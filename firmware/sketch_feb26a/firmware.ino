#include <WiFi.h>
#include <HTTPClient.h>

// Substitua pelos dados da sua rede
const char* ssid = "xx";
const char* password = "xxx";

// IP do seu PC e porta do servidor Node.js
// IMPORTANTE: Use o IP que você pegou no 'ipconfig'
const char* serverName = "http://xxxx:3001/update"; 

const int buttonPin = 0; // Botão BOOT do ESP32-S3
int lastButtonState = HIGH;

void setup() {
  Serial.begin(115200);
  pinMode(buttonPin, INPUT_PULLUP);

  WiFi.begin(ssid, password);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado!");
  Serial.print("IP do ESP32: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  int buttonState = digitalRead(buttonPin);

  // Detecta a borda de descida (clique)
  if (buttonState == LOW && lastButtonState == HIGH) {
    delay(50); // Debounce simples
    Serial.println("Botão pressionado! Enviando sinal...");
    enviarSinalAoServidor("Bacia do Rio Tibagi - Ativado via Botão");
  }
  lastButtonState = buttonState;
}

void enviarSinalAoServidor(String nomeBacia) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    // Monta o JSON
    String httpRequestData = "{\"bacia\":\"" + nomeBacia + "\"}";

    // Envia o POST
    int httpResponseCode = http.POST(httpRequestData);

    if (httpResponseCode > 0) {
      Serial.print("Resposta do Servidor: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Erro no envio: ");
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("Wi-Fi Desconectado");
  }
}