const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// বড় ছবি ও ডেটা হ্যান্ডেল করার জন্য পর্যাপ্ত লিমিট
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

const MONGO_URI = process.env.MONGO_URI || 'আপনার_MONGODB_URI_এখানে_দিন';
const ADMIN_PASSWORD = 'admin123'; // ফিক্সড পাসওয়ার্ড

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.log('MongoDB Error:', err.message));

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: Number,
    category: String,
    stockStatus: { type: String, default: 'In Stock' },
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

app.post('/api/admin/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'ভুল পাসওয়ার্ড' });
    }
});

app.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'পণ্য লোড ব্যর্থ' });
    }
});

app.post('/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: 'পণ্য আপলোড ব্যর্থ' });
    }
});

app.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'ডিলিট সফল' });
    } catch (err) {
        res.status(500).json({ error: 'ডিলিট ব্যর্থ' });
    }
});

app.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ insideDhaka: 80, outsideDhaka: 150 });
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'সেটিংস লোড ব্যর্থ' });
    }
});

app.post('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();
        settings.insideDhaka = req.body.insideDhaka;
        settings.outsideDhaka = req.body.outsideDhaka;
        await settings.save();
        res.json({ message: 'আপডেট সফল' });
    } catch (err) {
        res.status(500).json({ error: 'আপডেট ব্যর্থ' });
    }
});

app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'অর্ডার লোড ব্যর্থ' });
    }
});

app.post('/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ message: 'অর্ডার সফল' });
    } catch (err) {
        res.status(500).json({ error: 'অর্ডার ব্যর্থ' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
