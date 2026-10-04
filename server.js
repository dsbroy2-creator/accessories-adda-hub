const express = require("express"),
  fs = require("fs"),
  path = require("path"),
  multer = require("multer"),
  crypto = require("crypto");

const app = express(),
  PORT = process.env.PORT || 3000,
  ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password",
  ADMIN_TOKEN_VALUE = process.env.ADMIN_TOKEN || "admin-secret-token";

const DATA = path.join(__dirname, "data"),
  DB = path.join(DATA, "db.json"),
  UP = path.join(__dirname, "uploads");

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(UP)) fs.mkdirSync(UP, { recursive: true });

if (!fs.existsSync(DB)) {
  fs.writeFileSync(
    DB,
    JSON.stringify(
      {
        products: [
          { id: "p1", name: "Sunglasses", price: 0, description: "আপনার পছন্দের description এখানে লিখুন।", image: "", stock: true },
          { id: "p2", name: "Wallet / Money Bag", price: 0, description: "আপনার পছন্দের description এখানে লিখুন।", image: "", stock: true },
          { id: "p3", name: "Premium Black Watch", price: 400, description: "Premium quality stylish watch.", image: "watch.jpg", stock: true }
        ],
        orders: [],
        settings: {
          storeName: "Accessories Adda Hub",
          tagline: "Style starts with the right accessories.",
          deliveryText: "সারা বাংলাদেশে ডেলিভারি। অর্ডারের আগে ডেলিভারি চার্জ ও সময় নিশ্চিত করুন।",
          whatsapp: "01870697907",
          bkash: "",
          nagad: "",
          currency: "৳"
        }
      },
      null,
      2
    )
  );
}

const read = () => JSON.parse(fs.readFileSync(DB));
const write = (data) => fs.writeFileSync(DB, JSON.stringify(data, null, 2));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UP));
app.use(express.static(__dirname));

const storage = multer.diskStorage({
  destination: (q, f, cb) => cb(null, UP),
  filename: (q, f, cb) => cb(null, Date.now() + "-" + crypto.randomBytes(4).toString("hex") + path.extname(f.originalname))
});
const upload = multer({ storage });

function auth(q, r, next) {
  if ((q.headers["x-admin-token"] || q.headers["x-admin-token"]) === ADMIN_TOKEN_VALUE) {
    return next();
  }
  r.status(401).json({ error: "Unauthorized" });
}

app.post("/api/admin/login", (q, r) => {
  if (q.body.password === ADMIN_PASSWORD) {
    return r.json({ token: ADMIN_TOKEN_VALUE });
  }
  r.status(401).json({ error: "Wrong password" });
});

app.get("/api/products", (q, r) => r.json(read().products.filter((p) => p.stock)));
app.get("/api/settings", (q, r) => r.json(read().settings));

app.get("/api/admin/products", auth, (q, r) => r.json(read().products));
app.get("/api/admin/orders", auth, (q, r) => r.json(read().orders));
app.post("/api/admin/upload", auth, upload.single("image"), (q, r) => r.json({ url: "/uploads/" + q.file.filename }));

app.post("/api/admin/products", auth, (q, r) => {
  let d = read();
  let p = { id: "p_" + Date.now(), name: q.body.name, price: q.body.price, description: q.body.description, image: q.body.image, stock: true };
  d.products.push(p);
  write(d);
  r.json(p);
});

app.put("/api/admin/products/:id", auth, (q, r) => {
  let d = read();
  let p = d.products.find((x) => x.id === q.params.id);
  if (p) {
    Object.assign(p, q.body);
    write(d);
    r.json(p);
  } else r.status(404).json({ error: "Product not found" });
});

app.delete("/api/admin/products/:id", auth, (q, r) => {
  let d = read();
  d.products = d.products.filter((x) => x.id !== q.params.id);
  write(d);
  r.json({ success: true });
});

app.post("/api/orders", (q, r) => {
  let d = read();
  let order = { id: "ord_" + Date.now(), ...q.body, status: "Pending" };
  d.orders.push(order);
  write(d);
  r.json(order);
});

app.put("/api/admin/orders/:id", auth, (q, r) => {
  let d = read();
  let o = d.orders.find((x) => x.id === q.params.id);
  if (o) {
    o.status = q.body.status;
    write(d);
    r.json(o);
  } else r.status(404).json({ error: "Order not found" });
});

app.put("/api/admin/settings", auth, (q, r) => {
  let d = read();
  d.settings = { ...d.settings, ...q.body };
  write(d);
  r.json(d.settings);
});

app.use((q, r) => r.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => console.log("Shop running on " + PORT));
