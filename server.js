const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// ৫০০ এমবি পর্যন্ত ডেটা ও বড় ছবি আপলোড নিশ্চিত করার জন্য লিমিট
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// স্ট্যাটিক ফোল্ডার
app.use(express.static(path.join(__dirname, 'public')));

// ডাটাবেজ কানেকশন
mongoose.connect('mongodb://127.0.0.1:27017/accessories_adda_hub', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB Connected Successfully');
}).catch(err => {
    console.log('DB Connection Error: ', err);
});

// স্কিমাস ও মডেলস
const Settings = mongoose.model('Settings', new mongoose.Schema({
    insideDhaka: { type: Number, default: 80 },
    outsideDhaka: { type: Number, default: 150 }
}));

const Product = mongoose.model('Product', new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: Number,
    stockStatus: { type: String, default: 'In Stock' },
    images: [String],
    description: String,
    createdAt: { type: Date, default: Date.now }
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    productTitle: String,
    productPrice: Number,
    deliveryCharge: Number,
    totalPrice: Number,
    customerName: String,
    phone: String,
    address: String,
    deliveryArea: String,
    createdAt: { type: Date, default: Date.now }
}));

// রাউটস
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/settings', async (req, res) => {
    try {
        let s = await Settings.findOne();
        if(!s) s = await Settings.create({ insideDhaka: 80, outsideDhaka: 150 });
        res.json(s);
    } catch(e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/settings', async (req, res) => {
    try {
        const { insideDhaka, outsideDhaka } = req.body;
        let s = await Settings.findOne();
        if(!s) s = new Settings({ insideDhaka, outsideDhaka });
        else { s.insideDhaka = insideDhaka; s.outsideDhaka = outsideDhaka; }
        await s.save();
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/products', async (req, res) => {
    try {
        res.json(await Product.find().sort({ createdAt: -1 }));
    } catch(e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/products', async (req, res) => {
    try {
        await Product.create(req.body);
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: 'Error' });
    }
});

app.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/orders', async (req, res) => {
    try {
        res.json(await Order.find().sort({ createdAt: -1 }));
    } catch(e) { res.status(500).json({ error: 'Error' }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
