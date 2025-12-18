const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

console.log('📦 gridfsUpload middleware loaded');

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,

  file: (req, file) => {
    console.log('➡️ Multer file handler called');
    console.log('📄 Original filename:', file.originalname);
    console.log('📄 MIME type:', file.mimetype);

    return new Promise((resolve, reject) => {
      try {
        const ext = path.extname(file.originalname).toLowerCase();
        console.log('📎 File extension:', ext);

        const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];

        if (!allowed.includes(ext)) {
          console.error('❌ Invalid file type:', ext);
          return reject(new Error('Invalid file type'));
        }

        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            console.error('❌ crypto.randomBytes failed:', err);
            return reject(err);
          }

          const filename = buf.toString('hex') + ext;

          console.log('✅ Generated filename:', filename);
          console.log('📥 Saving to GridFS bucket: documents');

          resolve({
            filename,
            bucketName: 'documents',
          });
        });
      } catch (e) {
        console.error('🔥 Exception inside GridFS file handler:', e);
        reject(e);
      }
    });
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (safe)
  },
});

upload.on('error', (err) => {
  console.error('🔥 Multer global error:', err);
});

module.exports = upload;
