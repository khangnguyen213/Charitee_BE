const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  fullname: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  role: { type: String, enum: ["master", "admin", "user"], default: "user" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
});

module.exports = mongoose.model("Account", accountSchema);
