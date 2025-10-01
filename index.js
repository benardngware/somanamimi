require("dotenv").config();
const authenticateToken = require("./middleware/authMiddleware");
const express = require("express");
const pool = require("./db");
const authRoutes = require("./routes/auth");
const payments = require("./routes/payments"); // ✅ import payments router

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", payments); // ✅ mount payments router

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to SomaNaMimi API 🚀");
});

// Video routes
app.post("/api/videos", authenticateToken, async (req, res, next) => {
  const { title, url } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: "Both title and URL are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO videos (title, url) VALUES (?, ?)",
      [title, url]
    );

    res.status(201).json({ id: result.insertId, title, url });
  } catch (error) {
    next(error);
  }
});

// Delete a video
app.delete("/api/videos/:id", authenticateToken, async (req, res, next) => {
  const videoID = parseInt(req.params.id);

  try {
    const [result] = await pool.query("DELETE FROM videos WHERE id = ?", [
      videoID,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Video not found!" });
    }

    res.json({ message: `Video with id ${videoID} has been deleted!` });
  } catch (error) {
    next(error);
  }
});

// Get all videos
app.get("/api/videos", authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM videos");
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
