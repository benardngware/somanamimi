const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");  // use the pool
const router = express.Router();

// SIGNUP
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // save user
    const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    const [result] = await pool.query(query, [name, email, hashedPassword]);

    res.status(201).json({ 
      message: "User created successfully", 
      userId: result.insertId 
    });
  } catch (err) {
    console.error("Signup error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Email already registered" });
    }

    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
