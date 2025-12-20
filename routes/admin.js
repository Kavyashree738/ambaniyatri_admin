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
    const admin = require('../config/firebaseAdmin');
    const db = admin.firestore();

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
  try {
    const { filename } = req.params;

    console.log('🟢 [GRIDFS DOWNLOAD] filename:', filename);

    const db = mongoose.connection.db;

    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'documents', // MUST match multer bucketName
    });

    const files = await db
      .collection('documents.files')
      .find({ filename })
      .toArray();

    if (!files || files.length === 0) {
      console.log('❌ [GRIDFS DOWNLOAD] File not found in MongoDB');
      return res.status(404).json({ message: 'File not found' });
    }

    res.set(
      'Content-Type',
      files[0].contentType || 'application/octet-stream'
    );

    bucket.openDownloadStreamByName(filename).pipe(res);

    console.log('✅ [GRIDFS DOWNLOAD] Streaming from MongoDB');
  } catch (err) {
    console.error('🔥 [GRIDFS DOWNLOAD] Error:', err);
    res.status(500).json({ message: 'Error downloading file' });
  }
});




module.exports = router;
