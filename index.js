require("dotenv").config();
const authenticateToken = require("./middleware/authMiddleware");
const express = require("express");
const pool = require("./db");
const authRoutes = require("./routes/auth");
const videosRoutes = require("./routes/videos");
const paymentsRoutes = require("./routes/payments"); // ✅ import payments router

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videosRoutes)
app.use("/api/payments", paymentsRoutes); // ✅ mount payments router

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to SomaNaMimi API 🚀");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
