const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const MONGO_URI = "mongodb://127.0.0.1:27017";
const DB_NAME = "darywise_mobile_db";

async function seed() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    await db.collection("users").deleteMany({});
    await db.collection("products").deleteMany({});

    const hash = await bcrypt.hash("admin123", 10);
    await db.collection("users").insertOne({ fullname: "Admin User", email: "admin@darywise.com", password_hash: hash, is_admin: true, wallet_balance: 0 });

    const products = [
        // Drinks
        { rfid_uid: "TAG_DRK_001", name: "Coca Cola", price: 1000, stock_quantity: 50, category: "Drink" },
        { rfid_uid: "TAG_DRK_002", name: "Fanta Orange", price: 1000, stock_quantity: 45, category: "Drink" },
        { rfid_uid: "TAG_DRK_003", name: "Mineral Water 500ml", price: 500, stock_quantity: 100, category: "Drink" },
        { rfid_uid: "TAG_DRK_004", name: "Energy Drink", price: 2500, stock_quantity: 30, category: "Drink" },
        { rfid_uid: "TAG_DRK_005", name: "Cold Coffee", price: 3000, stock_quantity: 20, category: "Drink" },
        
        // Food
        { rfid_uid: "TAG_FOD_001", name: "Beef Burger", price: 4500, stock_quantity: 20, category: "Food" },
        { rfid_uid: "TAG_FOD_002", name: "Chicken Sandwich", price: 3800, stock_quantity: 25, category: "Food" },
        { rfid_uid: "TAG_FOD_003", name: "Potato Chips", price: 1200, stock_quantity: 60, category: "Food" },
        { rfid_uid: "TAG_FOD_004", name: "Biscuits Pack", price: 1500, stock_quantity: 80, category: "Food" },
        { rfid_uid: "TAG_FOD_005", name: "Fresh Apple", price: 800, stock_quantity: 50, category: "Food" },
        { rfid_uid: "TAG_FOD_006", name: "Chocolate Cupcake", price: 2000, stock_quantity: 15, category: "Food" },

        // Electronics
        { rfid_uid: "TAG_ELE_001", name: "USB-C Cable", price: 5000, stock_quantity: 40, category: "Electronics" },
        { rfid_uid: "TAG_ELE_002", name: "Power Bank 10,000mAh", price: 25000, stock_quantity: 12, category: "Electronics" },
        { rfid_uid: "TAG_ELE_003", name: "Wired Earphones", price: 8000, stock_quantity: 20, category: "Electronics" },
        { rfid_uid: "TAG_ELE_004", name: "Bluetooth Speaker", price: 45000, stock_quantity: 8, category: "Electronics" },
        { rfid_uid: "TAG_ELE_005", name: "LED Bulb 9W", price: 3500, stock_quantity: 50, category: "Electronics" },

        // Clothing
        { rfid_uid: "TAG_CLO_001", name: "Black Cotton T-Shirt", price: 7500, stock_quantity: 30, category: "Clothing" },
        { rfid_uid: "TAG_CLO_002", name: "Baseball Cap", price: 6000, stock_quantity: 15, category: "Clothing" },
        { rfid_uid: "TAG_CLO_003", name: "Woolen Socks (Pair)", price: 2500, stock_quantity: 40, category: "Clothing" },
        { rfid_uid: "TAG_CLO_004", name: "Polo Shirt", price: 15000, stock_quantity: 10, category: "Clothing" },
        { rfid_uid: "TAG_CLO_005", name: "Leather Belt", price: 12000, stock_quantity: 12, category: "Clothing" },

        // Other
        { rfid_uid: "TAG_OTH_001", name: "Notebook A5", price: 2000, stock_quantity: 50, category: "Other" },
        { rfid_uid: "TAG_OTH_002", name: "Ballpoint Pen Set (3)", price: 3000, stock_quantity: 100, category: "Other" },
        { rfid_uid: "TAG_OTH_003", name: "Compact Umbrella", price: 8000, stock_quantity: 10, category: "Other" },
        { rfid_uid: "TAG_OTH_004", name: "Key Organizer", price: 4500, stock_quantity: 25, category: "Other" },
        { rfid_uid: "TAG_OTH_005", name: "Ceramic Coffee Mug", price: 5500, stock_quantity: 18, category: "Other" }
    ];
    await db.collection("products").insertMany(products);
    console.log("Seeded!");
    await client.close();
}
seed();
