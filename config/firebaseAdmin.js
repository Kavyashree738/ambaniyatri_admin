const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ✅ create firestore instance
const db = admin.firestore();

// ✅ export both
module.exports = { admin, db };
