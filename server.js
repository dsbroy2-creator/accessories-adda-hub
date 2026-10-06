const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "db.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");

// Uploads ফোল্ডার না থাকলে তৈরি করা
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer ইমেজ আপলোড কনফিগারেশন
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// মিডলওয়্যার
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(__dirname));

// db.json পড়ার ও লেখার হেল্পার
function read() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      settings: {
        storeName: "Accessories Adda Hub",
        tagline: "Style starts with the right accessories.",
        whatsapp: "01870697907",
        address: "আগানগর কদমতলী, কেরানীগঞ্জ, ঢাকা",
        deliveryText: "",
        bkash: "01870697907",
        nagad: "01870697907",
        logo: ""
      },
      products: [],
      orders: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    return { settings: {}, products: [], orders: [] };
  }
}

function write(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// এডমিন অথেন্টিকেশন
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "change-this-password";
const AUTH_TOKEN = "secret-admin-token-12345";

function auth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (token === AUTH_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// ১. এডমিন লগইন এপিআই
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASS || password === "change-this-password") {
    res.json({ token: AUTH_TOKEN });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// ২. ইমেজ আপলোড এপিআই (লোগো ও প্রোডাক্ট ছবি)
app.post("/api/admin/upload", auth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileUrl = "/uploads/" + req.file.filename;
  res.json({ url: fileUrl });
});

// ৩. সেটিংস এপিআই
app.get("/api/settings", (req, res) => {
  const d = read();
  res.json(d.settings || {});
});

app.put("/api/admin/settings", auth, (req, res) => {
  const d = read();
  d.settings = { ...d.settings, ...req.body };
  write(d);
  res.json(d.settings);
});

// ৪. প্রোডাক্ট এপিআই
app.get("/api/products", (req, res) => {
  const d = read();
  res.json(d.products || []);
});

app.get("/api/admin/products", auth, (req, res) => {
  const d = read();
  res.json(d.products || []);
});

app.post("/api/admin/products", auth, (req, res) => {
  const d = read();
  const p = {
    id: "p_" + Date.now(),
    name: req.body.name || "",
    price: req.body.price || 0,
    description: req.body.description || "",
    image: req.body.image || "",
    stock: req.body.stock !== undefined ? req.body.stock : true
  };
  d.products = d.products || [];
  d.products.push(p);
  write(d);
  res.json(p);
});

app.put("/api/admin/products/:id", auth, (req, res) => {
  const d = read();
  d.products = d.products || [];
  const p = d.products.find((x) => x.id === req.params.id);
  if (p) {
    Object.assign(p, req.body);
    write(d);
    res.json(p);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

app.delete("/api/admin/products/:id", auth, (req, res) => {
  const d = read();
  d.products = (d.products || []).filter((x) => x.id !== req.params.id);
  write(d);
  res.json({ success: true });
});

// ৫. অর্ডার এপিআই
app.get("/api/admin/orders", auth, (req, res) => {
  const d = read();
  res.json(d.orders || []);
});

app.post("/api/orders", (req, res) => {
  const d = read();
  const order = {
    id: "ord_" + Date.now(),
    ...req.body,
    status: "Pending",
    createdAt: new Date().toISOString()
  };
  d.orders = d.orders || [];
  d.orders.push(order);
  write(d);
  res.json(order);
});

app.put("/api/admin/orders/:id", auth, (req, res) => {
  const d = read();
  d.orders = d.orders || [];
  const o = d.orders.find((x) => x.id === req.params.id);
  if (o) {
    if (req.body.status) o.status = req.body.status;
    write(d);
    res.json(o);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

app.delete("/api/admin/orders/:id", auth, (req, res) => {
  const d = read();
  d.orders = (d.orders || []).filter((x) => x.id !== req.params.id);
  write(d);
  res.json({ success: true });
});

// ৬. পেজ রাউটিং (ফাইল সার্ভিং)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// সার্ভার চালু
app.listen(PORT, () => {
  console.log("Shop running on port " + PORT);
});
