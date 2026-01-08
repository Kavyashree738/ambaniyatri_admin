const express = require('express');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

const router = express.Router();

console.log('📦 media routes loaded');

let promoBucket;

// ==============================
// 🟢 INIT GRIDFS BUCKET
// ==============================
mongoose.connection.once('open', () => {
  console.log('🟢 MongoDB open → initializing promo_media bucket');

  promoBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'promo_media',
  });

  console.log('📦 promo_media GridFS bucket ready');
});

// ==============================
// 📤 STREAM PROMO MEDIA
// ==============================
router.get('/:filename', (req, res) => {
  console.log('➡️ GET /api/media/' + req.params.filename);

  try {
    if (!promoBucket) {
      console.error('❌ promoBucket not ready');
      return res.status(500).json({ message: 'GridFS not ready' });
    }

    const downloadStream =
      promoBucket.openDownloadStreamByName(req.params.filename);

    downloadStream.on('error', (err) => {
      console.error('❌ Stream error:', err);
      res.status(404).json({ message: 'File not found' });
    });

    downloadStream.on('file', (file) => {
      console.log('✅ Streaming file:', file.filename);
      res.set('Content-Type', file.contentType || 'application/octet-stream');
    });

    downloadStream.pipe(res);
  } catch (e) {
    console.error('🔥 MEDIA ROUTE ERROR:', e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
