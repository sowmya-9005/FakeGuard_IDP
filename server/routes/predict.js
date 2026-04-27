const express = require("express");
const axios = require("axios");
const Prediction = require("../models/Prediction");

const router = express.Router();
const ML_SERVICE = process.env.ML_SERVICE_URL || "http://localhost:8000";

// POST /api/predict
router.post("/predict", async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === "")
    return res.status(400).json({ error: "Text is required" });

  try {
    const mlRes = await axios.post(`${ML_SERVICE}/predict`, { text });
    const { prediction, confidence, keywords } = mlRes.data;
    const saved = await Prediction.create({ text, prediction, confidence, keywords });
    res.json({ prediction, confidence, keywords, id: saved._id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Prediction failed" });
  }
});

// GET /api/history?filter=Fake|True&search=keyword
router.get("/history", async (req, res) => {
  try {
    const query = {};
    if (req.query.filter && req.query.filter !== "All")
      query.prediction = req.query.filter;
    if (req.query.search)
      query.text = { $regex: req.query.search, $options: "i" };

    const history = await Prediction.find(query).sort({ createdAt: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// GET /api/stats
router.get("/stats", async (req, res) => {
  try {
    const total = await Prediction.countDocuments();
    const fakeCount = await Prediction.countDocuments({ prediction: "Fake" });
    const trueCount = await Prediction.countDocuments({ prediction: "True" });
    res.json({ total, fakeCount, trueCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

module.exports = router;
