// routes/payments.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const pool = require("../db");

const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortCode = process.env.MPESA_SHORTCODE;
const passKey = process.env.MPESA_PASSKEY;
const callbackUrl = process.env.MPESA_CALLBACK_URL;

const DARAJA_URL =
  process.env.ENVIRONMENT === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function generateToken() {
  const auth = Buffer.from(
    process.env.MPESA_CONSUMER_KEY + ":" + process.env.MPESA_CONSUMER_SECRET
  ).toString("base64");

  const { data } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );

  return data.access_token;
}


//  STK Push (includes videoId & userId)
router.post("/stkpush", async (req, res) => {
  const { phone, amount, videoId, userId } = req.body;

  if (!phone || !amount || !videoId || !userId) {
    return res.status(400).json({ error: "phone, amount, videoId, and userId required" });
  }

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const password = Buffer.from(shortCode + passKey + timestamp).toString("base64");

  try {
    const token = await generateToken();

    const { data } = await axios.post(
      `${DARAJA_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortCode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: "Somanamimi",
        TransactionDesc: `Payment for Video ${videoId}`,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Store temporary request info → so we can match in callback
    await pool.query(
      "INSERT INTO payments (userId, videoId, MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, Amount, PhoneNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, videoId, data.MerchantRequestID, data.CheckoutRequestID, -1, "PENDING", amount, phone]
    );

    res.json({
      message: "STK push initiated",
      CheckoutRequestID: data.CheckoutRequestID,
      MerchantRequestID: data.MerchantRequestID,
      CustomerMessage: data.CustomerMessage,
    });
  } catch (error) {
    console.error("❌ STK Push Error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// 📌 M-Pesa callback
router.post("/callback", async (req, res) => {
  const stk = req.body.Body?.stkCallback;

  console.log("✅ M-Pesa Callback:", JSON.stringify(stk, null, 2));

  if (!stk) return res.status(400).json({ error: "Invalid callback" });

  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stk;

  try {
    if (ResultCode === 0) {
      const items = stk.CallbackMetadata?.Item || [];

      const Amount = items.find(i => i.Name === "Amount")?.Value || 0;
      const MpesaReceiptNumber = items.find(i => i.Name === "MpesaReceiptNumber")?.Value || "N/A";
      const TransactionDate = items.find(i => i.Name === "TransactionDate")?.Value || null;
      const PhoneNumber = items.find(i => i.Name === "PhoneNumber")?.Value || null;



      // ✅ Update payment record
      await pool.query(
        `UPDATE payments 
         SET ResultCode=?, ResultDesc=?, Amount=?, MpesaReceiptNumber=?, TransactionDate=?, PhoneNumber=? 
         WHERE MerchantRequestID=? AND CheckoutRequestID=?`,
        [ResultCode, ResultDesc, Amount, MpesaReceiptNumber, TransactionDate, PhoneNumber, MerchantRequestID, CheckoutRequestID]
      );

      // ✅ Unlock the video
      const [payment] = await pool.query(
        "SELECT userId, videoId FROM payments WHERE MerchantRequestID=?",
        [MerchantRequestID]
      );
      if (payment.length) {
        const { userId, videoId } = payment[0];
        await pool.query(
          "INSERT IGNORE INTO user_video_access (userId, videoId) VALUES (?, ?)",
          [userId, videoId]
        );
        console.log(`🎉 Video ${videoId} unlocked for user ${userId}`);
      }
    } else {
      // Update as failed
      await pool.query(
        `UPDATE payments SET ResultCode=?, ResultDesc=? 
         WHERE MerchantRequestID=? AND CheckoutRequestID=?`,
        [ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID]
      );
    }
  } catch (err) {
    console.error("❌ DB Error:", err);
  }

  res.status(200).json({ message: "Callback processed" });
});



module.exports = router;
