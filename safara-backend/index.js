const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();
const dns = require("dns");

const userRoutes = require("./Routes/userRoutes.js");
const meetRoutes = require("./Routes/meetRoutes.js");
const courseRoutes = require("./Routes/courseRoutes.js");
const whatsappRoutes = require("./Routes/whatsappRoutes.js");
const manualPaymentRoutes = require("./Routes/manualPaymentRoutes.js");
const paymentSettingsRoutes = require("./Routes/paymentSettingsRoutes.js");
const whatsappSettingsRoutes = require("./Routes/whatsappSettingsRoutes.js");
const uploadRoutes = require("./Routes/uploadRoutes.js");
const otherProjectRoutes = require("./Routes/otherProjectRoutes.js");
const adminRoutes = require("./Routes/adminRoutes.js");

const app = express();

/* ================================
   ✅ Trust Proxy (Important for cPanel / CloudLinux)
=================================== */
app.set("trust proxy", true);
dns.setServers(["8.8.8.8", "8.8.4.4"]);
/* ================================
   ✅ Secure Headers (cPanel safe)
=================================== */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

/* ================================
   ✅ Compression
=================================== */
app.use(compression());

/* ================================
   ✅ Body Parsers
=================================== */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ================================
   ✅ Strong Production CORS
=================================== */
const allowedOrigins = [
  "https://safaraapp.netlify.app",
  "https://safara-backend-mu.vercel.app",
  "https://safaralearningcenter.com",
  process.env.BASE_URL,
  "https://www.safaralearningcenter.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server, mobile apps, postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Blocked by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

/* ================================
   ✅ Force HTTPS (cPanel safe way)
=================================== */
app.use((req, res, next) => {
  const proto = req.headers["x-forwarded-proto"];
  if (proto && proto !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

/* ================================
   ✅ Health Check (for cPanel monitoring)
=================================== */
app.get("/", (req, res) => {
  res.status(200).send("✅ API is running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

/* ================================
   ✅ API Routes
=================================== */
app.use("/api/user", userRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/meet", meetRoutes);
app.use("/api/manual-payment", manualPaymentRoutes);
app.use("/api/payment-settings", paymentSettingsRoutes);
app.use("/api/whatsapp-settings", whatsappSettingsRoutes);
app.use("/api", uploadRoutes);
app.use("/api/other-projects", otherProjectRoutes);
app.use("/api/admin", adminRoutes);

/* ================================
   ✅ Global Error Handler (production safe)
=================================== */
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(500).json({
    message: "Internal server error",
  });
});

/* ================================
   ✅ MongoDB Connection
=================================== */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false, // faster in production
    });

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Error:", error.message);

    // Prevent broken app – let cPanel restart it
    process.exit(1);
  }
};

connectDB();

/* ================================
   ✅ Start Server (cPanel / Passenger safe)
=================================== */
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✅ Dev server running on port ${PORT}`);
  });
}

// For cPanel Passenger
module.exports = app;
