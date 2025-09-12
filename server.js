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

// File path for storage
const DATA_FILE = path.join(__dirname, "registrations.json");

// Utility: Load registrations
function loadRegistrations() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Utility: Save registrations
function saveRegistrations(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ✅ Registration Route
app.post("/register", async (req, res) => {
  const { name, email, phone, eventDate } = req.body;
  const ticketId = "TICKET-" + Date.now();

  // Save data to JSON
  const registrations = loadRegistrations();
  registrations.push({ name, email, phone, eventDate, ticketId });
  saveRegistrations(registrations);

  // Generate QR code
  const qrCodeData = await QRCode.toDataURL(ticketId);

  // Send email confirmation
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // from .env
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    await transporter.sendMail({
      from: `IBM Events <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Event Ticket",
      html: `<h2>Hello ${name},</h2>
             <p>Thanks for registering!</p>
             <p>Your Ticket ID: <b>${ticketId}</b></p>
             <img src="${qrCodeData}" />`,
    });
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
  }

  // Show ticket page
  res.render("ticket", { name, email, phone, eventDate, ticketId, qrCodeData });
});

// ✅ Login Routes
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.isAdmin = true;
    return res.redirect("/admin");
  }
  res.render("login", { error: "Invalid credentials" });
});

// ✅ Admin Dashboard
app.get("/admin", (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect("/login");
  }
  const regs = loadRegistrations();
  res.render("admin", { regs });
});

// ✅ Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
