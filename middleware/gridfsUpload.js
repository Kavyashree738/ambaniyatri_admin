const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (_, file) =>
    new Promise((resolve, reject) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];

      if (!allowed.includes(ext)) {
        return reject(new Error('Invalid file type'));
      }

      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);

        resolve({
          filename: buf.toString('hex') + ext,
          bucketName: 'documents'
        });
      });
    })
});

module.exports = multer({ storage });
