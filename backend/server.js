require("dotenv").config();
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mqtt = require("mqtt");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const PORT = 3001;
const MQTT_BROKER = "mqtt://broker.benax.rw:1883";
const MONGO_URI = "mongodb://127.0.0.1:27017";
const DB_NAME = "darywise_mobile_db";
const JWT_SECRET = "darywise_mobile_secret";
const TEAM_ID = "DaryWiseMobileTeam";

let db;
const app = express();
app.use(cors());
app.use(express.json());

// Database initialized below in consolidate init()

const authenticate = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No token" });
    try {
        req.user = jwt.verify(auth.split(" ")[1], JWT_SECRET);
        next();
    } catch { res.status(403).json({ error: "Bad token" }); }
};

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let clients = new Set();
wss.on("connection", ws => { clients.add(ws); ws.on("close", () => clients.delete(ws)); });

const mqttClient = mqtt.connect(MQTT_BROKER);
mqttClient.on("connect", () => { mqttClient.subscribe(`rfid/${TEAM_ID}/card/status`); });
mqttClient.on("message", async (t, m) => {
    const { uid } = JSON.parse(m.toString());
    const user = await db.collection("users").findOne({ card_uid: uid });
    const msg = JSON.stringify({ event: "rfid_scan", type: user ? "user" : "unregistered", user: user ? { ...user, id: user._id } : null, uid });
    clients.forEach(c => c.readyState === 1 && c.send(msg));
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await db.collection("users").findOne({ email });
    if (user && await bcrypt.compare(password, user.password_hash)) {
        const payload = { id: user._id, fullname: user.fullname, email: user.email, isAdmin: user.is_admin };
        res.json({ token: jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }), user: payload });
    } else res.status(401).json({ error: "Invalid login" });
});

app.post("/auth/register", async (req, res) => {
    const { fullname, email, password, card_uid } = req.body;
    const existing = await db.collection("users").findOne({ $or: [{ email }, { card_uid }] });
    if (existing) return res.status(400).json({ error: "Email or Card already registered" });
    const hash = await bcrypt.hash(password || "123456", 10);
    const user = await db.collection("users").insertOne({ fullname, email, card_uid, password_hash: hash, is_admin: false, wallet_balance: 0 });
    res.json({ status: "success", userId: user.insertedId });
});

app.get("/products", async (req, res) => {
    const p = await db.collection("products").find().toArray();
    res.json(p.map(x => ({ ...x, id: x._id })));
});

app.post("/api/products", authenticate, async (req, res) => {
    const { rfid_uid, name, price, stock_quantity, category } = req.body;
    await db.collection("products").insertOne({ rfid_uid, name, price: parseFloat(price), stock_quantity: parseInt(stock_quantity), category });
    res.json({ status: "success" });
});

app.put("/api/products/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { rfid_uid, name, price, stock_quantity, category } = req.body;
    await db.collection("products").updateOne({ _id: new ObjectId(id) }, { $set: { rfid_uid, name, price: parseFloat(price), stock_quantity: parseInt(stock_quantity), category } });
    res.json({ status: "success" });
});

app.delete("/api/products/:id", authenticate, async (req, res) => {
    await db.collection("products").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ status: "success" });
});

app.post("/payment/checkout", async (req, res) => {
    const { cartItems, totalAmount, cardUid, token } = req.body;
    let uId;
    if (cardUid) uId = (await db.collection("users").findOne({ card_uid: cardUid }))?._id;
    else if (token) uId = new ObjectId(jwt.verify(token, JWT_SECRET).id);
    if (!uId) return res.status(401).json({ error: "No user" });

    const user = await db.collection("users").findOne({ _id: uId });
    if (user.wallet_balance < totalAmount) return res.status(400).json({ error: "Low balance" });

    const tx = await db.collection("transactions").insertOne({ user_id: uId, total_amount: totalAmount, items: cartItems, timestamp: new Date(), status: "PAID" });
    await db.collection("users").updateOne({ _id: uId }, { $inc: { wallet_balance: -totalAmount } });
    res.json({ status: "success", customer_name: user.fullname, new_balance: user.wallet_balance - totalAmount });
});

app.post("/wallet/topup", authenticate, async (req, res) => {
    const { cardUid, amount } = req.body;
    const user = await db.collection("users").findOne({ card_uid: cardUid });
    if (!user) return res.status(404).json({ error: "Customer not found" });
    await db.collection("users").updateOne({ card_uid: cardUid }, { $inc: { wallet_balance: parseFloat(amount) } });
    res.json({ status: "success", new_balance: user.wallet_balance + parseFloat(amount) });
});

app.get("/api/customers", authenticate, async (req, res) => {
    const c = await db.collection("users").find({ is_admin: false }).toArray();
    res.json(c.map(u => ({ ...u, id: u._id })));
});

// Product Seed Data
const INITIAL_PRODUCTS = [
    { rfid_uid: "TAG_DRK_001", name: "Coca Cola", price: 1000, stock_quantity: 50, category: "Drink" },
    { rfid_uid: "TAG_DRK_002", name: "Fanta Orange", price: 1000, stock_quantity: 45, category: "Drink" },
    { rfid_uid: "TAG_DRK_003", name: "Mineral Water 500ml", price: 500, stock_quantity: 100, category: "Drink" },
    { rfid_uid: "TAG_DRK_004", name: "Energy Drink", price: 2500, stock_quantity: 30, category: "Drink" },
    { rfid_uid: "TAG_DRK_005", name: "Cold Coffee", price: 3000, stock_quantity: 20, category: "Drink" },
    { rfid_uid: "TAG_FOD_001", name: "Beef Burger", price: 4500, stock_quantity: 20, category: "Food" },
    { rfid_uid: "TAG_FOD_002", name: "Chicken Sandwich", price: 3800, stock_quantity: 25, category: "Food" },
    { rfid_uid: "TAG_FOD_003", name: "Potato Chips", price: 1200, stock_quantity: 60, category: "Food" },
    { rfid_uid: "TAG_FOD_004", name: "Biscuits Pack", price: 1500, stock_quantity: 80, category: "Food" },
    { rfid_uid: "TAG_FOD_005", name: "Fresh Apple", price: 800, stock_quantity: 50, category: "Food" },
    { rfid_uid: "TAG_ELE_001", name: "USB-C Cable", price: 5000, stock_quantity: 40, category: "Electronics" },
    { rfid_uid: "TAG_ELE_002", name: "Power Bank", price: 25000, stock_quantity: 12, category: "Electronics" },
    { rfid_uid: "TAG_CLO_001", name: "Cotton T-Shirt", price: 7500, stock_quantity: 30, category: "Clothing" },
    { rfid_uid: "TAG_OTH_001", name: "Notebook A5", price: 2000, stock_quantity: 50, category: "Other" },
];

async function init() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("DB Connected");

    // Seed products if empty
    const count = await db.collection("products").countDocuments();
    if (count === 0) {
        console.log("Seeding products...");
        await db.collection("products").insertMany(INITIAL_PRODUCTS);
    }
}
init();

// Consolidated initialization moved above server.listen

app.get("/api/transactions", authenticate, async (req, res) => {
    try {
        const t = await db.collection("transactions").aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            {
                $unwind: { path: "$customer", preserveNullAndEmptyArrays: true }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $project: {
                    _id: 1,
                    total_amount: 1,
                    items: 1,
                    timestamp: 1,
                    status: 1,
                    customer_name: "$customer.fullname"
                }
            }
        ]).toArray();
        res.json(t);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

server.listen(PORT, () => console.log(`Server on ${PORT}`));
