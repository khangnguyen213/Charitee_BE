const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  accountID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
  },
  causeID: {
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
