const router = require('express').Router();
const upload = require('../middleware/gridfsUpload');
const c = require('../controllers/documentsController');

router.post(
  '/upload',
  upload.fields([
    { name: 'driver_photo' },
    { name: 'aadhar_card' },
    { name: 'driving_license' },
    { name: 'vehicle_registration' },
    { name: 'pan_card' },
    { name: 'insurance' },
    { name: 'bank_passbook' }
  ]),
  c.uploadDocuments
);

router.get('/status/:userId', c.getStatus);
router.get('/:userId', c.getDocuments);
router.patch('/verify/:userId', c.verifyDriver);

module.exports = router;
