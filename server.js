const express = require("express");
const path = require("path");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const session = require("express-session");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// JSON file to store registrations
const DATA_FILE = path.join(__dirname, "registrations.json");

// Load registrations
function loadRegistrations() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Save registrations
function saveRegistrations(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ✅ Registration Route → redirect to payment
app.post("/register", (req, res) => {
  const { name, email, phone, eventDate } = req.body;
  const ticketId = "TICKET-" + Date.now();

  const registrations = loadRegistrations();
  registrations.push({ name, email, phone, eventDate, ticketId, paid: false });
  saveRegistrations(registrations);

  res.redirect(`/payment?ticketId=${ticketId}`);
});

// ✅ Payment Page
app.get("/payment", (req, res) => {
  const { ticketId } = req.query;
  res.render("payment", { ticketId });
});

// ✅ Payment Processing
app.post("/pay", async (req, res) => {
  const { ticketId, method, card } = req.body;

  const registrations = loadRegistrations();
  const reg = registrations.find((r) => r.ticketId === ticketId);

  if (!reg) return res.send("❌ Ticket not found");

  reg.paid = true;
  saveRegistrations(registrations);

  // Generate QR
  const qrCodeData = await QRCode.toDataURL(ticketId);

  // Send ticket email
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `IBM Events <${process.env.EMAIL_USER}>`,
      to: reg.email,
      subject: "Your Event Ticket (Payment Successful)",
      html: `<h2>Hello ${reg.name},</h2>
             <p>Your payment of ₹500 is successful.</p>
             <p>Ticket ID: <b>${ticketId}</b></p>
             <img src="${qrCodeData}" />`,
    });
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
  }

  res.render("ticket", { ...reg, qrCodeData });
});

// ✅ Login Page
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// ✅ Login Handling
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.redirect("/admin");
  }
  res.render("login", { error: "Invalid credentials" });
});

// ✅ Admin Dashboard
app.get("/admin", (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/login");
  const regs = loadRegistrations();
  res.render("admin", { regs });
});

// ✅ Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// ✅ Start server
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);