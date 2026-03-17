# MQTT Topics Documentation

## Overview
This document outlines all MQTT topics used in the Smart RFID Payment Mobile App system. The application uses MQTT for communication between hardware (RFID reader) and the backend server.

## MQTT Broker Configuration
- **Broker Address**: `broker.benax.rw`
- **Port**: `1883`
- **Protocol**: MQTT 3.1.1

---

## Topics Structure

### Topic Format
```
rfid/{TEAM_ID}/{component}/{action}
```

---

## Active Topics by Component

### 1. **Hardware Component (ESP8266 RFID Reader)**
**TEAM_ID**: `DaryWiseMobileTeam`

#### Published Topics (Hardware → Backend)

| Topic | Payload Structure | Description | Frequency |
|-------|-------------------|-------------|-----------|
| `rfid/DaryWiseMobileTeam/card/status` | `{"uid": "XX:XX:XX:XX", "balance": 0, "timestamp": 1234567890}` | RFID card detected/scanned event | On card detection or every 2+ seconds |
| `rfid/DaryWiseMobileTeam/card/balance` | `{"uid": "XX:XX:XX:XX", "new_balance": 1000, "type": "topup", "timestamp": 1234567890}` | Balance update after top-up | After top-up operation |

#### Subscribed Topics (Backend → Hardware)

| Topic | Payload Structure | Description |
|-------|-------------------|-------------|
| `rfid/DaryWiseMobileTeam/card/topup` | `{"uid": "XX:XX:XX:XX", "amount": 100}` | Add money to card balance |
| `rfid/DaryWiseMobileTeam/card/pay` | `{"uid": "XX:XX:XX:XX", "amount": 50}` | Deduct payment from card balance |

---

### 2. **Backend Server Component (Node.js)**
**TEAM_ID**: `DaryWiseMobileTeam`

#### Subscribed Topics (Hardware → Backend)

| Topic | Payload Structure | Description |
|-------|-------------------|-------------|
| `rfid/DaryWiseMobileTeam/card/status` | `{"uid": "XX:XX:XX:XX", "balance": 0, "timestamp": 1234567890}` | Receives RFID scan events and processes user authentication |

#### WebSocket Events (Backend → Frontend)

| Event | Payload Structure | Description |
|-------|-------------------|-------------|
| `rfid_scan` | `{"event": "rfid_scan", "type": "user\|unregistered", "user": {...}, "uid": "XX:XX:XX:XX"}` | Real-time RFID scan event forwarded to connected WebSocket clients |

---

### 3. **Frontend Component (React Native)**

The frontend connects via **WebSocket** (not direct MQTT) to the backend at:
- **URL**: `ws://backend-url:port` (auto-converted from HTTP URL)
- **Connection**: Establishes persistent WebSocket connection for real-time updates

#### Received WebSocket Events

| Event | Payload | Description |
|-------|---------|-------------|
| `rfid_scan` | `{"event": "rfid_scan", "type": "user\|unregistered", "user": {...}, "uid": "XX:XX:XX:XX"}` | Real-time notification when RFID card is scanned |

---

## Data Flow Diagram

```
RFID Reader (Hardware)
    ↓
    └─→ MQTT: rfid/DaryWiseMobileTeam/card/status
            ↓
    Backend Server (Node.js)
            ↓
    WebSocket: rfid_scan event
            ↓
    Frontend (React Native)
            ↓
        Display Scan Result
```

---

## Payload Examples

### RFID Status (Card Scan)
```json
{
  "uid": "5F:A8:2B:4C",
  "balance": 5000,
  "timestamp": 1710720123.456
}
```

### Balance Update (Top-Up)
```json
{
  "uid": "5F:A8:2B:4C",
  "new_balance": 6000,
  "type": "topup",
  "timestamp": 1710720125.789
}
```

### Top-Up Command
```json
{
  "uid": "5F:A8:2B:4C",
  "amount": 1000
}
```

### Payment Command
```json
{
  "uid": "5F:A8:2B:4C",
  "amount": 500
}
```

### WebSocket RFID Scan Event
```json
{
  "event": "rfid_scan",
  "type": "user",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "card_uid": "5F:A8:2B:4C",
    "wallet_balance": 5000,
    "is_admin": false
  },
  "uid": "5F:A8:2B:4C"
}
```

---

## Team IDs
| Component | Team ID | Status |
|-----------|---------|--------|
| Hardware (ESP8266) | `DaryWiseMobileTeam` | Active |
| Backend Server | `DaryWiseMobileTeam` | Active |

:white_check_mark: **Note**: All Team IDs are standardized to `DaryWiseMobileTeam` across the system.

---

## Important Notes

1. **Hardware sends to**: `rfid/DaryWiseMobileTeam/card/*`
2. **Backend subscribes to**: `rfid/DaryWiseMobileTeam/card/status` :white_check_mark:
3. **Frontend uses WebSocket**, not direct MQTT connection
4. **Local Card Balance Cache**: Hardware maintains in-memory card balances
5. **Auto-reconnection**: WebSocket reconnects every 5 seconds if disconnected
6. **LED Indicators** on hardware:
   - Blink 3x: Top-up successful
   - Blink 1x (0.5s): Payment processed
   - Blink continuously: WiFi connecting

---

## MQTT Client Information

### Hardware Client
- **Client ID**: `esp_` + hex(machine.unique_id())
- **Keep-Alive**: 60 seconds
- **Connection Type**: MicroPython `umqtt.simple`

### Backend Server
- **Library**: Node.js `mqtt` package
- **Connection**: Auto-reconnect enabled
