const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
  },
  cause: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cause",
  },
  amount: {
    type: Number,
    required: true,
  },
  donatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Donation", donationSchema);
