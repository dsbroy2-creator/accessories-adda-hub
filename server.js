const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// বড় ছবি এবং ডেটা আপলোড করার জন্য লিমি트 বাড়িয়ে দেওয়া হলো (যাতে কোনো এরর না আসে)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// স্ট্যাটিক ফোল্ডার সেটআপ
app.use(express.static(path.join(__dirname, 'public')));

// ডাটাবেজ কানেকশন (আপনার যদি নিজস্ব ইউআরএল থাকে সেটি এখানে দিতে পারেন)
mongoose.connect('mongodb://127.0.0.1:27017/accessories_adda_hub', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB Connected Successfully');
}).catch(err => {
    console.log('DB Connection Error: ', err);
});

// ১. সেটিংস স্কিমা ও মডেল
const settingsSchema = new mongoose.Schema({
    insideDhaka: { type: Number, default: 80 },
    outsideDhaka: { type: Number, default: 150 }
});
const Settings = mongoose.model('Settings', settingsSchema);

// ২. প্রোডাক্ট স্কিমা ও মডেল (৬টি পর্যন্ত ছবি রাখার ব্যবস্থা)
const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number },
    stockStatus: { type: String, default: 'In Stock' },
    images: [String],
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

// ৩. অর্ডার স্কিমা ও মডেল
const orderSchema = new mongoose.Schema({
    productTitle: String,
    productPrice: Number,
    deliveryCharge: Number,
    totalPrice: Number,
    customerName: String,
    phone: String,
    address: String,
    deliveryArea: String,
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);


// --- রাউটস (Routes) ---

// এডমিন পেজ রাউট
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// সেটিংস গেট করা
app.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({ insideDhaka: 80, outsideDhaka: 150 });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// সেটিংস আপডেট করা
app.post('/settings', async (req, res) => {
    try {
        const { insideDhaka, outsideDhaka } = req.body;
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ insideDhaka, outsideDhaka });
        } else {
            settings.insideDhaka = insideDhaka;
            settings.outsideDhaka = outsideDhaka;
        }
        await settings.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// সকল প্রোডাক্ট গেট করা
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// নতুন প্রোডাক্ট আপলোড (ছবিসহ)
app.post('/products', async (req, res) => {
    try {
        const { title, price, oldPrice, stockStatus, images, description } = req.body;
        
        const newProduct = new Product({
            title,
            price,
            oldPrice,
            stockStatus,
            images, // এখানে ৬টি ছবির বেস৬৪ অ্যারে সেভ হবে
            description
        });

        await newProduct.save();
        res.json({ success: true, message: 'Product added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload product' });
    }
});

// প্রোডাক্ট ডিলিট করা
app.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// অর্ডার লিস্ট গেট করা
app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// সার্ভার স্টার্ট
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
