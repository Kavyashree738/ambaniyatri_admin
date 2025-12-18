require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/documents', require('./routes/documents'));

let gfs;
mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'documents'
  });
  console.log('📦 GridFS ready');
});

app.get('/api/documents/file/:filename', (req, res) => {
  try {
    gfs.openDownloadStreamByName(req.params.filename).pipe(res);
  } catch {
    res.status(404).json({ message: 'File not found' });
  }
});

app.get('/', (_, res) => {
  res.send('🚀 JioYatri Backend Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
