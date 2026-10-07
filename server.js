const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// ৫০০ এমবি লিমিট সেটআপ
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// পাবলিক ফোল্ডার স্ট্যাটিক করা
app.use(express.static(path.join(__dirname, 'public')));

// ডাটাবেজ কানেকশন
mongoose.connect('mongodb://127.0.0.1:27017/accessories_adda_hub', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected Successfully')).catch(e => console.log('DB Error:', e));

// ডাটাবেজ স্কিমা ও মডেলস
const SettingsSchema = new mongoose.Schema({ insideDhaka: Number, outsideDhaka: Number });
const Settings = mongoose.model('Settings', SettingsSchema);

const ProductSchema = new mongoose.Schema({ 
    title: String, 
    price: Number, 
    oldPrice: Number, 
    category: String,
    stockStatus: String, 
    images: [String], // ৫টি ছবির অ্যারে ফিল্ড
    description: String, 
    createdAt: { type: Date, default: Date.now } 
});
const Product = mongoose.model('Product', ProductSchema);

const OrderSchema = new mongoose.Schema({ 
    productTitle: String, 
    productPrice: Number, 
    customerName: String, 
    phone: String, 
    address: String, 
    createdAt: { type: Date, default: Date.now } 
});
const Order = mongoose.model('Order', OrderSchema);

// এডমিন প্যানেল রাউট (public ফোল্ডারের ভেতর থেকে admin.html লোড করার সঠিক পাথ)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// সেটিংস API
app.get('/settings', async (req, res) => {
    try {
        let s = await Settings.findOne();
        res.json(s || { insideDhaka: 80, outsideDhaka: 150 });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

app.post('/settings', async (req, res) => {
    try {
        let s = await Settings.findOne();
        if (!s) s = new Settings(req.body);
        else { s.insideDhaka = req.body.insideDhaka; s.outsideDhaka = req.body.outsideDhaka; }
        await s.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// প্রোডাক্ট API
app.get('/products', async (req, res) => {
    try {
        let products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

app.post('/products', async (req, res) => {
    try {
        await Product.create(req.body);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// অর্ডার API
app.get('/orders', async (req, res) => {
    try {
        let orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running smoothly on port ${PORT}`));
