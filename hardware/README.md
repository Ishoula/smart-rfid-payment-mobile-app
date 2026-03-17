# DaryWise Hardware Setup Guide

This folder contains the MicroPython code for the ESP8266 + MFRC522 RFID reader.

## 🔌 Wiring Diagram (ESP8266)

| MFRC522 Pin | ESP8266 Pin | Type |
|-------------|-------------|------|
| SCK         | D5 (GPIO 14)| SPI  |
| MOSI        | D7 (GPIO 13)| SPI  |
| MISO        | D6 (GPIO 12)| SPI  |
| RST         | D3 (GPIO 0) | Reset|
| CS/SDA      | D4 (GPIO 2) | Chip Select |
| 3.3V        | 3.3V        | Power|
| GND         | GND         | Ground|

## 🚀 Installation

1.  Flash your ESP8266 with **MicroPython**.
2.  Install the `umqtt.simple` library if not present.
3.  Upload `mfrc522.py` (the driver) to the device.
4.  Open `main.py` and set your WiFi credentials:
    ```python
    WIFI_SSID = "your_wifi_name"
    WIFI_PASS = "your_wifi_password"
    ```
5.  Upload `main.py` to the device and restart it.

## 📡 MQTT Details
The system communicates using the **broker.benax.rw** broker under the team ID: `Darius_Divine_Louise`.

- **Status Topic**: `rfid/Darius_Divine_Louise/card/status`
- **Top-up Topic**: `rfid/Darius_Divine_Louise/card/topup`
- **Pay Topic**: `rfid/Darius_Divine_Louise/card/pay`
