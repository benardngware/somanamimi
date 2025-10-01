const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Add video (protected)
router.post("/", authenticateToken, async (req, res, next) => {
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

// Delete video (protected)
router.delete("/:id", authenticateToken, async (req, res, next) => {
  const videoID = parseInt(req.params.id);

  try {
    const [result] = await pool.query("DELETE FROM videos WHERE id = ?", [
      videoID,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Video not found!" });
    }
    res.json({ message: `Video with id ${videoID} deleted!` });
  } catch (error) {
    next(error);
  }
});

// Get all videos (protected)
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM videos");
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
