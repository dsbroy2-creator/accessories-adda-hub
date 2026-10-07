const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// ১. CORS সেটিং (কোনো বাড়তি cors প্যাকেজ ছাড়াই কাজ করবে)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// ২. স্ট্যাটিক ফাইল ও রাউটিং (index.html ও admin.html সরাসরি দেখাবে)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ৩. ডাটাবেজ কানেকশন
// Render Environment Variable থেকে MONGO_URI নিবে
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster.mongodb.net/shop?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.error("MongoDB Connection Error:", err.message));

// ৪. স্কিমা ও মডেল (পণ্য এবং অর্ডারের জন্য)
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
    productTitle: String,
    productPrice: Number,
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// ৫. API এন্ট্রিপয়েন্ট

// সকল প্রোডাক্ট পাওয়ার API
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "পণ্য লোড করতে ব্যর্থ হয়েছে" });
    }
});

// নতুন প্রোডাক্ট যুক্ত করার API
app.post('/products', async (req, res) => {
    try {
        const { title, price, images, description } = req.body;
        const newProduct = new Product({ title, price, images, description });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: "পণ্য যুক্ত করতে ব্যর্থ হয়েছে" });
    }
});

// প্রোডাক্ট ডিলিট করার API
app.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "পণ্য ডিলিট হয়েছে" });
    } catch (err) {
        res.status(500).json({ error: "ডিলিট করতে ব্যর্থ হয়েছে" });
    }
});

// সকল অর্ডার দেখার API (এডমিন প্যানেলের জন্য)
app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "অর্ডার লোড করতে ব্যর্থ হয়েছে" });
    }
});

// নতুন কাস্টমার অর্ডার সাবমিট করার API
app.post('/orders', async (req, res) => {
    try {
        const { customerName, phone, address, productTitle, productPrice } = req.body;
        const newOrder = new Order({ customerName, phone, address, productTitle, productPrice });
        await newOrder.save();
        res.status(201).json({ message: "অর্ডার সফল হয়েছে" });
    } catch (err) {
        res.status(500).json({ error: "অর্ডার করতে ব্যর্থ হয়েছে" });
    }
});

// ৬. সার্ভার চালু করার পোল্ট
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Shop running on port ${PORT}`);
});
