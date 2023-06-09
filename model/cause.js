const mongoose = require("mongoose");

const causeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  goal: { type: Number, required: true },
  raised: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  finishAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ["active", "inactive", "finished"],
    default: "active",
  },
});

module.exports = mongoose.model("Cause", causeSchema);
