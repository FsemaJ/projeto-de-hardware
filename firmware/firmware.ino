#include <WiFi.h>
#include <HTTPClient.h>

// Configurações da sua rede
const char* ssid = "Ap17";
const char* password = "HsxFs7_J3W";

// Endereço do seu Backend
const char* serverPath = "http://192.168.1.8:3001/api/bacia/proxima";

const int pinoBotao = 12; // Pino solicitado
bool ultimoEstadoBotao = HIGH;

void setup() {
  Serial.begin(115200);
  pinMode(pinoBotao, INPUT_PULLUP); // Usa o resistor interno

  WiFi.begin(ssid, password);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Conectado!");
}

void trocarBacia() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverPath);
    
    // Envia um POST vazio (o backend resolve qual é a bacia)
    int httpResponseCode = http.POST("");

    if (httpResponseCode > 0) {
      Serial.print("Sucesso! Status: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Erro na requisição: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}

void loop() {
  bool estadoAtual = digitalRead(pinoBotao);

  // Detecta quando o botão é pressionado (de HIGH para LOW)
  if (ultimoEstadoBotao == HIGH && estadoAtual == LOW) {
    delay(50); // Debounce simples para evitar falsos cliques
    if (digitalRead(pinoBotao) == LOW) {
      Serial.println("Botão pressionado! Trocando bacia...");
      trocarBacia();
    }
  }
  ultimoEstadoBotao = estadoAtual;
}
