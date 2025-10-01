// routes/payments.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

// Safaricom credentials from .env
const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortCode = process.env.MPESA_SHORTCODE;
const passKey = process.env.MPESA_PASSKEY;
const callbackUrl = process.env.MPESA_CALLBACK_URL;

// Generate access token
router.get("/token", async (req, res) => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lipa Na Mpesa STK Push
router.post("/stkpush", async (req, res) => {
  const { phone, amount } = req.body;

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);

  const password = Buffer.from(shortCode + passKey + timestamp).toString("base64");

  try {
    const { data: tokenData } = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${consumerKey}:${consumerSecret}`
          ).toString("base64")}`,
        },
      }
    );

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
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
        TransactionDesc: "Payment",
      },
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// M-Pesa callback
router.post("/callback", (req, res) => {
  console.log("✅ M-Pesa Callback:", JSON.stringify(req.body, null, 2));
  res.status(200).json({ message: "Callback received successfully" });
});


module.exports = router;
