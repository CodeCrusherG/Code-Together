const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  content: { type: String, default: "" },
  language: { type: String, default: "javascript" },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", documentSchema);