const router = require('express').Router();
const upload = require('../middleware/gridfsUpload');
const c = require('../controllers/documentsController');

// 🔍 ROUTE ENTRY LOG
router.post(
  '/upload',
  (req, res, next) => {
    console.log('🚀 /api/documents/upload HIT');
    next();
  },

  upload.fields([
    { name: 'driver_photo' },
    { name: 'aadhar_card' },
    { name: 'driving_license' },
    { name: 'vehicle_registration' },
    { name: 'pan_card' },
    { name: 'insurance' },
    { name: 'bank_passbook' },
  ]),

  (req, res, next) => {
    console.log('📦 Multer finished');
    console.log('📁 req.files:', Object.keys(req.files || {}));
    console.log('📦 req.body:', req.body);
    next();
  },

  c.uploadDocuments
);

router.get('/status/:userId', c.getStatus);
router.get('/:userId', c.getDocuments);
router.patch('/verify/:userId', c.verifyDriver);

module.exports = router;
