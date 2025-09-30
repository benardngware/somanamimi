require("dotenv").config();
const express = require("express");
const pool = require("./db");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to SomaNaMimi API 🚀");
});

// Video routes
app.get("/api/videos", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM videos");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/videos", async (req, res) => {
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
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/videos/:id", async (req, res) => {
  const videoID = parseInt(req.params.id);

  try {
    const [result] = await pool.query("DELETE FROM videos WHERE id = ?", [videoID]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Video not found!" });
    }

    res.json({ message: `Video with id ${videoID} has been deleted!` });
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
