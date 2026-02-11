const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const Document = require('../models/Document');
const mongoose = require('mongoose');

/**
 * 🔑 ADMIN LOGIN CHECK
 */
router.post('/login', adminAuth, (req, res) => {
  res.json({
    success: true,
    email: req.admin.email
  });
});

/**
 * 📋 GET ALL PENDING DRIVERS
 */
router.get('/pending', adminAuth, async (req, res) => {
  const docs = await Document.find({ status: 'pending' });
  res.json(docs);
});


router.get('/drivers', adminAuth, async (req, res) => {
  try {
    const docs = await Document.find().sort({
      status: 1,        // pending → approved → rejected (alphabetical)
      createdAt: -1
    });

    res.json(docs);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch drivers' });
  }
});

/**
 * 👤 GET DRIVER FULL DETAILS (Mongo + Firebase)
 */
router.get('/driver/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ MongoDB document (documents + status)
    const doc = await Document.findOne({ userId });
    if (!doc) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // 2️⃣ Firebase Firestore profile (THIS IS THE FIX)
    const { admin, db } = require('../config/firebaseAdmin');


    let profile = null;

    try {
      const snap = await db.collection('users').doc(userId).get();
      if (snap.exists) {
        profile = snap.data();
        console.log('📱 Phone from Firestore:', profile.phone);
      } else {
        console.warn('⚠️ Firestore profile not found');
      }
    } catch (e) {
      console.error('🔥 Firestore fetch error:', e);
    }

    // 3️⃣ Send merged data
    return res.json({
      mongo: doc,
      profile: profile
        ? {
            phone: profile.phone,
            wallet: profile.wallet,
            referral_code: profile.referral_code,
            user_type: profile.user_type,
            status: profile.status,
          }
        : null,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch driver details' });
  }
});


/**
 * 🔓 PUBLIC: Get driver photo from MongoDB ONLY
 * NO Firebase
 * NO adminAuth
 */
/**
 * 🔓 PUBLIC: Serve uploaded documents/images
 * NO adminAuth
 */
router.get('/public/documents/:filename', async (req, res) => {
  console.log('────────────────────────────────────────');
  console.log('🟢 [GRIDFS] Incoming request');
  console.log('🌐 URL:', req.originalUrl);

  try {
    const { filename } = req.params;
    console.log('📄 [GRIDFS] Requested filename:', filename);

    // 1️⃣ Mongo DB connection
    const db = mongoose.connection.db;
    if (!db) {
      console.error('❌ [GRIDFS] MongoDB not connected');
      return res.status(500).json({ message: 'DB not connected' });
    }
    console.log('✅ [GRIDFS] MongoDB connection OK');

    // 2️⃣ Create GridFS bucket
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'documents',
    });
    console.log('🪣 [GRIDFS] Bucket initialized: documents');

    // 3️⃣ Check file existence
    const files = await db
      .collection('documents.files')
      .find({ filename })
      .toArray();

    console.log('📂 [GRIDFS] Files found:', files.length);

    if (!files || files.length === 0) {
      console.warn('⚠️ [GRIDFS] File NOT found in MongoDB');
      return res.status(404).json({ message: 'File not found' });
    }

    const file = files[0];
    console.log('🧾 [GRIDFS] File metadata:', {
      filename: file.filename,
      contentType: file.contentType,
      length: file.length,
    });

    // 4️⃣ Response headers
    res.set({
      'Content-Type': file.contentType || 'image/jpeg',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000',
    });

    console.log('📤 [GRIDFS] Response headers set (inline image)');

    // 5️⃣ Stream file
    const downloadStream = bucket.openDownloadStreamByName(filename);

    downloadStream.on('error', (err) => {
      console.error('🔥 [GRIDFS] Stream error:', err);
      res.sendStatus(500);
    });

    downloadStream.on('end', () => {
      console.log('✅ [GRIDFS] Streaming completed');
    });

    console.log('🚀 [GRIDFS] Streaming file...');
    downloadStream.pipe(res);

  } catch (err) {
    console.error('🔥 [GRIDFS] Unexpected error:', err);
    res.status(500).json({ message: 'Error downloading file' });
  }
});

/**
 * 🔓 PUBLIC: Get driver photo filename using userId
 * Used by Flutter USER APP
 */
router.get('/public/driver-photo/:userId', async (req, res) => {
  console.log('────────────────────────────────────────');
  console.log('🟢 [DRIVER PHOTO] ROUTE HIT');
  console.log('🆔 userId:', req.params.userId);

  try {
    const { userId } = req.params;

    const doc = await Document.findOne({ userId });

    if (!doc) {
      console.log('❌ No document found');
      return res.status(404).json({ message: 'Driver not found' });
    }

    const photo = doc.files?.driver_photo;

    console.log('🖼️ Extracted photo filename:', photo);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    return res.json({ photo });

  } catch (err) {
    console.error('🔥 driver-photo error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});





module.exports = router;
