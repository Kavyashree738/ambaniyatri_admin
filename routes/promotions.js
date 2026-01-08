const router = require('express').Router();
const promoUpload = require('../middleware/promoUpload');
const ctrl = require('../controllers/promotionController');

console.log('📦 promotions routes loaded');

/* ===============================
   📤 UPLOAD
================================ */
router.post(
  '/upload',
  (req, res, next) => {
    console.log('➡️ POST /api/promotions/upload');
    next();
  },
  promoUpload.single('media'),
  ctrl.uploadPromotion
);

/* ===============================
   📥 GET ALL
================================ */
router.get(
  '/',
  (req, res, next) => {
    console.log('➡️ GET /api/promotions');
    next();
  },
  ctrl.getActivePromotions
);

/* ===============================
   🗑️ DELETE (🔥 THIS WAS MISSING)
================================ */
router.delete(
  '/:id',
  (req, res, next) => {
    console.log('➡️ DELETE /api/promotions/' + req.params.id);
    next();
  },
  ctrl.deletePromotion
);

module.exports = router;
