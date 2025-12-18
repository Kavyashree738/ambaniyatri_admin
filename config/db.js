const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (e) {
    console.error('❌ MongoDB connection failed', e);
    process.exit(1);
  }
};
