const Document = require('../models/Document');

/**
 * ================================
 * 📤 UPLOAD DOCUMENTS
 * ================================
 */
exports.uploadDocuments = async (req, res) => {
  console.log('================ UPLOAD DOCUMENTS =================');

  try {
    console.log('➡️ Request received');

    // 🔹 Log body
    console.log('📦 req.body:', req.body);

    const { userId, fullName, email } = req.body;

    if (!userId) {
      console.error('❌ userId missing in request body');
      return res.status(400).json({ message: 'User ID missing' });
    }

    // 🔹 Log files object
    console.log('📁 req.files keys:', Object.keys(req.files || {}));

    const files = req.files || {};
    const mapped = {};

    // 🔹 Map uploaded GridFS filenames
    Object.keys(files).forEach((field) => {
      console.log(
        `🧾 Processing file field="${field}", filename="${files[field][0].filename}"`
      );
      mapped[field] = files[field][0].filename;
    });

    console.log('🗂️ Final mapped files object:', mapped);

    // 🔹 DB operation
    console.log('💾 Saving to MongoDB...');
    const saved = await Document.findOneAndUpdate(
      { userId },
      {
        userId,
        fullName,
        email,
        files: mapped,
        status: 'pending'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Document saved successfully:', saved._id);

    return res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: saved
    });
  } catch (e) {
    console.error('🔥 UPLOAD ERROR:', e);
    return res.status(500).json({ message: 'Upload failed', error: e.message });
  }
};

/**
 * ================================
 * 🔍 CHECK VERIFICATION STATUS
 * ================================
 */
exports.getStatus = async (req, res) => {
  console.log('================ CHECK STATUS =================');
  console.log('➡️ userId:', req.params.userId);

  try {
    const doc = await Document.findOne({ userId: req.params.userId });

    if (!doc) {
      console.warn('⚠️ No document found for user');
      return res.json({ verified: false });
    }

    console.log('📄 Document status:', doc.status);

    return res.json({
      verified: doc.status === 'approved',
      status: doc.status,
    });
  } catch (e) {
    console.error('🔥 STATUS CHECK ERROR:', e);
    return res.json({ verified: false });
  }
};

/**
 * ================================
 * 📄 FETCH DOCUMENT LIST
 * ================================
 */
exports.getDocuments = async (req, res) => {
  console.log('================ FETCH DOCUMENTS =================');
  console.log('➡️ userId:', req.params.userId);

  try {
    const doc = await Document.findOne({ userId: req.params.userId });

    if (!doc) {
      console.warn('⚠️ No documents found');
      return res.status(404).json({ message: 'Not found' });
    }

    console.log('📂 Files returned:', doc.files);
    console.log('📌 Status:', doc.status);

    return res.json({
      documents: doc.files,
      status: doc.status
    });
  } catch (e) {
    console.error('🔥 FETCH DOCUMENTS ERROR:', e);
    return res.status(500).json({ message: 'Fetch failed', error: e.message });
  }
};

/**
 * ================================
 * ✅ ADMIN VERIFY / REJECT
 * ================================
 */
exports.verifyDriver = async (req, res) => {
  console.log('================ VERIFY DRIVER =================');
  console.log('➡️ userId:', req.params.userId);
  console.log('➡️ new status:', req.body.status);

  try {
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      console.error('❌ Invalid status value:', status);
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updated = await Document.findOneAndUpdate(
      { userId: req.params.userId },
      { status },
      { new: true }
    );

    if (!updated) {
      console.warn('⚠️ User not found for verification');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Verification updated:', updated.status);

    return res.json({
      success: true,
      status: updated.status
    });
  } catch (e) {
    console.error('🔥 VERIFY ERROR:', e);
    return res.status(500).json({ message: 'Verification failed', error: e.message });
  }
};

exports.checkSelfieStatus = async (req, res) => {
  console.log('================ CHECK SELFIE STATUS ================');
  console.log('➡️ userId param:', req.params.userId);

  try {
    const doc = await Document.findOne({ userId: req.params.userId });

    if (!doc) {
      console.warn('⚠️ No document found for this user');
      return res.json({ needsSelfie: false });
    }

    console.log('📄 Document found:', doc._id);
    console.log('📌 Status:', doc.status);
    console.log('📆 createdAt:', doc.createdAt);
    console.log('📸 selfieUpdatedAt:', doc.selfieUpdatedAt || 'NOT SET');

    // 🔑 Base date logic
    const baseDate = doc.selfieUpdatedAt || doc.createdAt;
    console.log('🧮 Base date used for calculation:', baseDate);

    const msDiff = Date.now() - new Date(baseDate).getTime();
    const daysPassed = msDiff / (1000 * 60 * 60 * 24);

    console.log('⏱️ Milliseconds diff:', msDiff);
    console.log('📅 Days passed:', daysPassed.toFixed(2));

    const needsSelfie = daysPassed >= 7;
    console.log('🚨 Needs selfie upload:', needsSelfie);

    console.log('📁 driver_photo filename:', doc.files?.driver_photo || 'NOT FOUND');

    return res.json({
      needsSelfie,
      lastSelfieAt: baseDate,
      selfieFile: doc.files?.driver_photo || null,
      status: doc.status
    });
  } catch (e) {
    console.error('🔥 ERROR in checkSelfieStatus:', e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * =====================================
 * 📤 UPLOAD SELFIE ONLY
 * =====================================
 */
exports.uploadSelfie = async (req, res) => {
  console.log('================ UPLOAD SELFIE ================');
  console.log('📦 req.body:', req.body);
  console.log('📁 req.file:', req.file ? req.file.filename : 'NO FILE');

  try {
    const { userId } = req.body;

    if (!userId) {
      console.error('❌ userId missing in request body');
      return res.status(400).json({ message: 'userId missing' });
    }

    if (!req.file) {
      console.error('❌ Selfie file missing');
      return res.status(400).json({ message: 'selfie file missing' });
    }

    console.log('🔍 Searching document for userId:', userId);

    const updated = await Document.findOneAndUpdate(
      { userId },
      {
        $set: {
          'files.driver_photo': req.file.filename,
          selfieUpdatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updated) {
      console.warn('⚠️ Document not found for selfie upload');
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log('✅ Selfie updated successfully');
    console.log('📸 New selfie filename:', updated.files.driver_photo);
    console.log('📆 New selfieUpdatedAt:', updated.selfieUpdatedAt);
    console.log('📌 Status unchanged:', updated.status);

    return res.json({
      success: true,
      message: 'Selfie updated',
      selfieUpdatedAt: updated.selfieUpdatedAt,
      status: updated.status
    });
  } catch (e) {
    console.error('🔥 ERROR in uploadSelfie:', e);
    return res.status(500).json({ error: e.message });
  }
};
