#include <Wire.h>

void setup() {
  Wire.begin(); // Padrão ESP32: SDA=21, SCL=22
  Serial.begin(115200);
  while (!Serial); 
  Serial.println("\nI2C Scanner - Verificando APDS-9960...");
}

void loop() {
  byte error, address;
  int nDevices = 0;

  Serial.println("Escaneando...");

  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("Dispositivo I2C encontrado no endereco 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.println(" !");
      nDevices++;
    }
  }

  if (nDevices == 0) {
    Serial.println("Nenhum dispositivo I2C encontrado.\n");
  } else {
    Serial.println("Scanner finalizado.\n");
  }

  delay(5000); 
}