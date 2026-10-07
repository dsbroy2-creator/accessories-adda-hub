const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// মিডলওয়্যার (Middleware)
app.use(express.json());
app.use(cors());

// আপনার সঠিক ক্লাউড কানেকশন ইউআরআই (আপনার দেওয়া পাসওয়ার্ডসহ)
const mongoURI = 'mongodb+srv://আপনার_ইউজারনেম:Change-this-password@cluster0.qnkqy6x.mongodb.net/accessories_adda_hub?retryWrites=true&w=majority';

// ডাটাবেজ কানেকশন
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB Atlas Connected Successfully!');
})
.catch((err) => {
    console.error('MongoDB Connection Error:', err);
});

// বেস রাউট বা টেস্ট রাউট
app.get('/', (req, res) => {
    res.send('Accessories Adda Hub Server is Running and Connected to Cloud DB!');
});

// রেন্ডার সার্ভারের জন্য পোর্ট কনফিগারেশন
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
