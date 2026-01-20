// controllers/promotionController.js
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb'); // ✅ FIX IS HERE
const Promotion = require('../models/Promotion');

console.log('📦 promotionController loaded');

/* ==============================
   📤 UPLOAD PROMOTION
================================ */
exports.uploadPromotion = async (req, res) => {
  console.log('================ UPLOAD PROMOTION =================');

  try {
    console.log('➡️ req.body:', req.body);
    console.log('➡️ req.file:', req.file);

    const { title, type } = req.body;

    if (!req.file) {
      console.error('❌ File missing');
      return res.status(400).json({ message: 'File missing' });
    }

    if (!type) {
      console.error('❌ Type missing');
      return res.status(400).json({ message: 'Type missing' });
    }

    const promo = await Promotion.create({
      title,
      type,
      fileName: req.file.filename,
      active: true,
    });

    console.log('✅ Promotion saved:', promo._id);

    res.json({
      success: true,
      data: promo,
    });
  } catch (e) {
    console.error('🔥 UPLOAD ERROR:', e);
    res.status(500).json({ message: e.message });
  }
};

/* ==============================
   📥 GET PROMOTIONS
================================ */
exports.getActivePromotions = async (req, res) => {
  console.log('================ GET PROMOTIONS =================');

  try {
    const promos = await Promotion.find({ active: true }).sort({ order: 1 });
    console.log(`📦 Found ${promos.length} promotions`);
    res.json(promos);
  } catch (e) {
    console.error('🔥 FETCH ERROR:', e);
    res.status(500).json({ message: e.message });
  }
};

/* ==============================
   ▶ ADD YOUTUBE PROMOTION
================================ */
exports.addYoutubePromotion = async (req, res) => {
  try {
    const { title, url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "YouTube URL required" });
    }

    const promo = await Promotion.create({
      title,
      type: "youtube",
      url,
      active: true,
    });

    console.log("✅ YouTube promotion added:", promo._id);

    res.json({ success: true, data: promo });
  } catch (e) {
    console.error("🔥 YOUTUBE ERROR:", e);
    res.status(500).json({ message: e.message });
  }
};


/* ==============================
   🗑️ DELETE PROMOTION
================================ */
exports.deletePromotion = async (req, res) => {
  console.log('================ DELETE PROMOTION =================');
  console.log('➡️ promoId:', req.params.id);

  try {
    const promo = await Promotion.findById(req.params.id);

    if (!promo) {
      console.warn('⚠️ Promotion not found');
      return res.status(404).json({ message: 'Promotion not found' });
    }

    console.log('🗂️ Deleting file:', promo.fileName);

    // ✅ Initialize GridFS bucket
    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'promo_media',
    });

    // 🔍 Find file in GridFS
    const file = await mongoose.connection.db
      .collection('promo_media.files')
      .findOne({ filename: promo.fileName });

    if (file) {
      await bucket.delete(file._id);
      console.log('✅ GridFS file deleted');
    } else {
      console.warn('⚠️ GridFS file not found');
    }

    // ❌ Remove Mongo document
    await Promotion.findByIdAndDelete(req.params.id);
    console.log('✅ Promotion document deleted');

    res.json({ success: true });
  } catch (e) {
    console.error('🔥 DELETE ERROR:', e);
    res.status(500).json({ message: e.message });
  }
};

