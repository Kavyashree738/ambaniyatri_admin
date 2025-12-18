const router = require('express').Router();
const upload = require('../middleware/gridfsUpload');
const c = require('../controllers/documentsController');

router.post(
  '/upload',

  // 🔴 STEP 1: Route hit
  (req, res, next) => {
    console.log('==============================');
    console.log('🚀 STEP 1: /api/documents/upload HIT');
    console.log('➡️ Headers:', req.headers['content-type']);
    next();
  },

  // 🔴 STEP 2: Before multer
  (req, res, next) => {
    console.log('🚀 STEP 2: Entering multer');
    next();
  },

  // 🔴 STEP 3: Multer (GridFS)
  upload.fields([
    { name: 'driver_photo' },
    { name: 'aadhar_card' },
    { name: 'driving_license' },
    { name: 'vehicle_registration' },
    { name: 'pan_card' },
    { name: 'insurance' },
    { name: 'bank_passbook' },
  ]),

  // 🔴 STEP 4: After multer
  (req, res, next) => {
    console.log('🚀 STEP 4: Multer finished');
    console.log('📁 req.files keys:', Object.keys(req.files || {}));
    console.log('📦 req.body:', req.body);

    if (!req.files || Object.keys(req.files).length === 0) {
      console.warn('⚠️ NO FILES RECEIVED BY MULTER');
    }

    next();
  },

  // 🔴 STEP 5: Controller entry
  (req, res, next) => {
    console.log('🚀 STEP 5: Entering controller');
    next();
  },

  c.uploadDocuments
);

router.get('/status/:userId', c.getStatus);
router.get('/:userId', c.getDocuments);
router.patch('/verify/:userId', c.verifyDriver);

module.exports = router;
