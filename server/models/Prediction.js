const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  text:       { type: String, required: true },
  prediction: { type: String, required: true },
  confidence: { type: Number },
  keywords:   { type: Array, default: [] },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model("Prediction", predictionSchema);
