const router = require('express').Router();
const upload = require('../middleware/gridfsUpload');
const c = require('../controllers/documentsController');
const mongoose = require('mongoose');

/**
 * ==============================
 * 📤 UPLOAD DOCUMENTS (POST)
 * ==============================
 */
router.post(
  '/upload',

  // STEP 1: Route hit
  (req, res, next) => {
    console.log('==============================');
    console.log('🚀 POST /api/documents/upload HIT');
    console.log('➡️ Content-Type:', req.headers['content-type']);
    next();
  },

  // STEP 2: Before multer
  (req, res, next) => {
    console.log('🚀 STEP 2: Entering multer');
    next();
  },

  // STEP 3: Multer (GridFS)
  upload.fields([
    { name: 'driver_photo' },
    { name: 'aadhar_card' },
    { name: 'driving_license' },
    { name: 'vehicle_registration' },
    { name: 'pan_card' },
    { name: 'insurance' },
    { name: 'bank_passbook' },
  ]),

  // STEP 4: After multer
  (req, res, next) => {
    console.log('🚀 STEP 4: Multer finished');
    console.log('📁 Files received:', Object.keys(req.files || {}));
    console.log('📦 Body received:', req.body);

    if (!req.files || Object.keys(req.files).length === 0) {
      console.warn('⚠️ NO FILES RECEIVED BY MULTER');
    }

    next();
  },

  // STEP 5: Before controller
  (req, res, next) => {
    console.log('🚀 STEP 5: Passing control to controller');
    next();
  },

  // STEP 6: Controller
  c.uploadDocuments
);

/**
 * ==============================
 * 🔍 CHECK VERIFICATION STATUS
 * ==============================
 */
router.get('/status/:userId', (req, res, next) => {
  console.log('🔍 GET /api/documents/status/', req.params.userId);
  next();
}, c.getStatus);

/**
 * ==============================
 * 📸 CHECK SELFIE STATUS (7 DAYS)
 * ==============================
 */
router.get('/selfie-status/:userId', c.checkSelfieStatus);

/**
 * ==============================
 * 📤 UPLOAD SELFIE ONLY (GridFS)
 * ==============================
 */
router.post(
  '/selfie-upload',
  upload.single('driver_photo'),
  c.uploadSelfie
);

/**
 * ==============================
 * ✅ ADMIN VERIFY
 * ==============================
 */
router.patch('/verify/:userId', (req, res, next) => {
  console.log('✅ PATCH /api/documents/verify/', req.params.userId);
  next();
}, c.verifyDriver);


/**
 * ==============================
 * 📂 SERVE FILE FROM GRIDFS
 * ==============================
 * GET /api/files/:filename
 */
router.get('/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log('📂 GET FILE:', filename);

    const db = mongoose.connection.db;

    // ⚠️ bucket name MUST match multer config
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads',
    });

    const file = await db
      .collection('uploads.files')
      .findOne({ filename });

    if (!file) {
      console.warn('❌ File not found:', filename);
      return res.status(404).json({ message: 'File not found' });
    }

    res.set('Content-Type', file.contentType || 'image/jpeg');

    const stream = bucket.openDownloadStreamByName(filename);
    stream.pipe(res);
  } catch (e) {
    console.error('🔥 File stream error:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * ==============================
 * 📄 FETCH DOCUMENTS (MUST BE LAST)
 * ==============================
 */
router.get('/:userId', (req, res, next) => {
  console.log('📄 GET /api/documents/', req.params.userId);
  next();
}, c.getDocuments);

module.exports = router;
