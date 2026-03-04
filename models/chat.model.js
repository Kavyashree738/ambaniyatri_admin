const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderRole: String,
  senderId: String,
  message: String,
  time: { type: Date, default: Date.now },
});

const rideChatSchema = new mongoose.Schema({
  rideId: { type: String, unique: true },
  messages: [messageSchema],
});

module.exports = mongoose.model("RideChat", rideChatSchema);
