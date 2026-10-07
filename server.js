const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// CORS হ্যান্ডলার (কোনো বাড়তি প্যাকেজ লাগবে না)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    next();
});

app.use(express.json());

// স্ট্যাটিক ফাইল ও পেজ সার্ভ
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ডাটাবেজ কানেকশন
// নোট: Render-এ Environment Variable সেট করা না থাকলে নিচে "আপনার_MONGODB_LINK_এখানে_দিন" উঠিয়ে আসল লিংক বসান
const MONGO_URI = process.env.MONGO_URI || "আপনার_MONGODB_LINK_এখানে_দিন";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// স্কিমা ও মডেল
const productSchema = new mongoose.Schema({
    title: String,
    price: Number,
    images: [String],
    description: String,
    createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    customerName: String,
    phone: String,
    address: String,
    productTitle: String,
    productPrice: Number,
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// API Routes
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
        const { title, price, images, description } = req.body;
        const newProduct = new Product({ title, price, images, description });
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
        const { customerName, phone, address, productTitle, productPrice } = req.body;
        const newOrder = new Order({ customerName, phone, address, productTitle, productPrice });
        await newOrder.save();
        res.status(201).json({ message: "অর্ডার সফল হয়েছে" });
    } catch (err) {
        res.status(500).json({ error: "অর্ডার করতে ব্যর্থ হয়েছে" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Shop running on port ${PORT}`);
});
