// models/Promotion.js
const mongoose = require('mongoose');

console.log('📦 Promotion model loaded');

const PromotionSchema = new mongoose.Schema({
  title: String,
  type: {
    type: String,
    enum: ['image', 'video','youtube'],
    required: true,
  },
  fileName: String,
  url: String, 
  active: { type: Boolean, default: true },
  order: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Promotion', PromotionSchema);


