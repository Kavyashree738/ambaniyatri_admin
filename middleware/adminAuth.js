const admin = require('../config/firebaseAdmin');

module.exports = async function adminAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Admin token missing' });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    const allowedAdmins = process.env.ADMIN_EMAILS
      .split(',')
      .map(e => e.trim());

    if (!allowedAdmins.includes(decoded.email)) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    return res.status(401).json({ message: 'Invalid admin token' });
  }
};
