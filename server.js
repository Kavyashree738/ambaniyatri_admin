require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const connectDB = require('./config/db');
const mongodb = require('mongodb');
console.log('🟢 server.js loaded');
console.log('👉 Mongoose version:', mongoose.version);
console.log('👉 MongoDB driver version:', mongodb.version || mongodb.MongoClient?.prototype?.topology?.s?.options?.metadata?.driver?.version);

const app = express();

console.log('🟢 Connecting to MongoDB...');
connectDB();

app.use(cors());
app.use(express.json());

// 🔴 VERY IMPORTANT: log every incoming request
app.use((req, res, next) => {
  console.log(`🌐 INCOMING REQUEST → ${req.method} ${req.url}`);
  next();
});

console.log('🟢 Mounting /api/documents routes');
app.use('/api/documents', require('./routes/documents'));
app.use('/api/admin', require('./routes/admin'));


let gfs;
mongoose.connection.once('open', () => {
  console.log('🟢 MongoDB connection OPEN event fired');

  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'documents'
  });

  console.log('📦 GridFS ready');
});

app.get('/api/documents/file/:filename', (req, res) => {
  console.log('📥 File download request:', req.params.filename);

  try {
    gfs.openDownloadStreamByName(req.params.filename).pipe(res);
  } catch (e) {
    console.error('❌ File download error:', e);
    res.status(404).json({ message: 'File not found' });
  }
});

app.get('/', (req, res) => {
  console.log('🏠 Root route hit');
  res.send('🚀 JioYatri Backend Running');
});

// 🔴 EXPLICIT 404 FALLBACK (IMPORTANT)
app.use((req, res) => {
  console.log('❌ FALLBACK 404 HIT →', req.method, req.url);
  res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
