# DaryWise Mobile App 📱

A React Native (Expo) mobile version of the DaryWise RFID Smart Shop, optimized for **phones and tablets**.

---

## 📁 Structure

```
RFID-SMART-SHOP-MOBILE/
├── backend/          # Node.js + Express + MongoDB + MQTT + WebSocket
│   ├── server.js     # Main API server (JWT auth, port 3001)
│   ├── seed.js       # Database seed script
│   ├── package.json
│   └── .env.example  # Copy to .env and configure
│
└── frontend/         # React Native (Expo) mobile app
    ├── App.js
    ├── context/      AuthContext.js
    ├── services/     api.js, websocket.js
    ├── navigation/   AppNavigator.js
    ├── screens/      Login, POS, Transactions, Customers, Products, Settings
    └── theme/        colors.js
```

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd RFID-SMART-SHOP-MOBILE/backend
npm install

# Copy and edit environment configuration
copy .env.example .env

# Seed the database (requires MongoDB running)
node seed.js

# Start the server
npm start
```

Server runs at: **http://localhost:3001**

Default admin: `admin@darywise.com` / `admin123`

### 2. Frontend Setup

```bash
cd RFID-SMART-SHOP-MOBILE/frontend
npm install

# IMPORTANT: Update your server IP before running
# Edit: services/api.js → change BASE_URL to your PC's local IP
# Example: http://192.168.1.100:3001

npx expo start
```

Scan the QR code with **Expo Go** (available on Android/iOS App Store).

> **Note:** Use your machine's local IP address (not `localhost`) in `api.js` so phones on the same WiFi can connect.

---

## 📱 Screens

| Screen | Description |
|---|---|
| **Login** | Admin email/password sign-in with JWT |
| **POS** | Product grid, cart, RFID-triggered checkout |
| **Sales** | Transaction history, expandable items |
| **Customers** | Customer list, wallet top-up, register new |
| **Products** | Admin product CRUD (add, edit, delete) |
| **Settings** | Server URL config, profile, logout |

---

## 🖥️ Tablet Support

The app automatically adapts to larger screens (≥768px wide):
- POS shows 4-column product grid with side cart panel
- Customers & Products show 2-column grid layout

---

## 🔌 Backend Changes from Original

| Feature | Original (Web) | Mobile Backend |
|---|---|---|
| Auth | express-session | **JWT tokens** |
| Port | 3000 | **3001** |
| Database | `darywise_db` | `darywise_mobile_db` |
| CORS | Limited | **All origins** |
| Customers API | ❌ | **GET /api/customers** |
