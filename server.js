const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// CORS Handling
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());
app.use(express.static(__dirname));

// Routing
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || "আপনার_MONGODB_URI_এখানে_দিন";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.error("MongoDB Error:", err.message));

// Schemas
const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    images: [String],
    description: String,
    createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    deliveryArea: String,
    deliveryCharge: Number,
    productTitle: String,
    productPrice: Number,
    totalPrice: Number,
    createdAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
    insideDhaka: { type: Number, default: 80 },
    outsideDhaka: { type: Number, default: 150 }
});

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Settings = mongoose.model('Settings', settingsSchema);

// Admin Login API
app.post('/api/admin/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) res.json({ success: true });
    else res.status(401).json({ success: false, message: "ভুল পাসওয়ার্ড!" });
});

// Products API
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "পণ্য লোড করতে ব্যর্থ হয়েছে" });
    }
});

app.post('/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: "পণ্য যুক্ত করতে ব্যর্থ হয়েছে" });
    }
});

app.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "পণ্য ডিলিট হয়েছে" });
    } catch (err) {
        res.status(500).json({ error: "ডিলিট করতে ব্যর্থ হয়েছে" });
    }
});

// Settings API (Delivery Charges)
app.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ insideDhaka: 80, outsideDhaka: 150 });
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: "সেটিংস লোড করতে ব্যর্থ হয়েছে" });
    }
});

app.post('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();
        settings.insideDhaka = req.body.insideDhaka;
        settings.outsideDhaka = req.body.outsideDhaka;
        await settings.save();
        res.json({ message: "সেটিংস আপডেট হয়েছে" });
    } catch (err) {
        res.status(500).json({ error: "সেটিংস আপডেট করতে ব্যর্থ হয়েছে" });
    }
});

// Orders API
app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "অর্ডার লোড করতে ব্যর্থ হয়েছে" });
    }
});

app.post('/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ message: "অর্ডার সফল হয়েছে" });
    } catch (err) {
        res.status(500).json({ error: "অর্ডার করতে ব্যর্থ হয়েছে" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Shop running on port ${PORT}`));
