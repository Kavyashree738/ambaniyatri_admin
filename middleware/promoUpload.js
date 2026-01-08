// middleware/promoUpload.js
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

console.log('📦 promoUpload middleware loaded');

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,

  file: (req, file) => {
    console.log('➡️ promoUpload file handler called');
    console.log('📄 originalname:', file.originalname);
    console.log('📄 mimetype:', file.mimetype);

    return new Promise((resolve, reject) => {
      const ext = path.extname(file.originalname).toLowerCase();
      console.log('📎 extension:', ext);

      const allowed = [
        '.jpg', '.jpeg', '.png', '.webp',
        '.mp4', '.mov', '.mkv'
      ];

      if (!allowed.includes(ext)) {
        console.error('❌ Invalid promo media type:', ext);
        return reject(new Error('Invalid promo media type'));
      }

      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          console.error('❌ crypto error:', err);
          return reject(err);
        }

        const filename = buf.toString('hex') + ext;
        console.log('✅ Saving promo media:', filename);

        resolve({
          filename,
          bucketName: 'promo_media',
        });
      });
    });
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});
