const { db } = require("../config/firebaseAdmin");

exports.getDriversOnRide = async (req, res) => {
  try {
    console.log("🚀 Fetching drivers on ride...");

    const snap = await db
      .collection("drivers")
      .where("isActive", "==", false)
      .where("current_ride_id", "!=", null)
      .orderBy("current_ride_id")
      .orderBy("updated_on", "desc")
      .get();

    console.log(`✅ Firestore returned ${snap.docs.length} docs`);

    const data = snap.docs.map((doc, i) => {
      const x = doc.data();

      console.log("\n========================");
      console.log(`📦 DRIVER ${i + 1}`);
      console.log("Doc ID →", doc.id);
      console.log("Full Data →", x);
      console.log("Point Map →", x.point);
      console.log("GeoPoint →", x.point?.geopoint);

      const lat = x.lat ?? x.point?.geopoint?.latitude ?? null;
      const lng = x.lng ?? x.point?.geopoint?.longitude ?? null;


      console.log("Extracted Lat →", lat);
      console.log("Extracted Lng →", lng);
      console.log("========================\n");

      return {
        id: doc.id,
        current_ride_id: x.current_ride_id || null,
        vehicle_type: x.vehicle_type || null,

        // ✅ correct geopoint extraction
        lat,
        lng,

        geohash: x.point?.geohash || null,
        updated_on: x.updated_on || null,
        isActive: x.isActive ?? false,
        isVerified: x.isVerified ?? false,
      };
    });

    console.log("🎯 Final API response →", data);

    return res.json({
      success: true,
      count: data.length,
      drivers: data,
    });
  } catch (err) {
    console.error("❌ getDriversOnRide error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getRideDetails = async (req, res) => {
  try {
    const { rideId } = req.params;

    console.log("🚀 Fetch ride:", rideId);

    const doc = await db.collection("rides").doc(rideId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const x = doc.data();

    // ===== FETCH DRIVER INFO (from accepted_by reference) =====
    let driverInfo = null;

    if (x.accepted_by) {
      const driverDoc = await x.accepted_by.get();

      if (driverDoc.exists) {
        const d = driverDoc.data();

        driverInfo = {
          name: d.full_name || null,
          phone: d.phone || null,
        };
      }
    }

    // ===== FETCH USER INFO (from requested_by reference) =====
    let userInfo = null;

    if (x.requested_by) {
      const userDoc = await x.requested_by.get();

      if (userDoc.exists) {
        const u = userDoc.data();

        userInfo = {
          name: u.full_name || null,
          phone: u.phone || null,
        };
      }
    }

    const pickup = x.from || {};
    const drop = x.to || {};

    return res.json({
      success: true,
      ride: {
        id: rideId,

        accepted_at: x.accepted_at || null,
        status: x.status || null,
        driver: driverInfo,
        user: userInfo,

        distance: x.distance || null,
        duration: x.duration || null,

        pickup: {
          address: pickup.address || null,
          geohash: pickup.point?.geohash || null,
          lat: pickup.point?.geopoint?.latitude || null,
          lng: pickup.point?.geopoint?.longitude || null,
        },

        drop: {
          address: drop.address || null,
          geohash: drop.point?.geohash || null,
          lat: drop.point?.geopoint?.latitude || null,
          lng: drop.point?.geopoint?.longitude || null,
        },

        polyline: x.polyline || null,

        safety_flag: x.safety_flag || false,
        safety_reason: x.safety_reason || null,
        safety_time: x.safety_time
          ? x.safety_time.toDate().toISOString()
          : null,
      },
    });
  } catch (err) {
    console.error("❌ Ride fetch error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.saveAdminToken = async (req, res) => {
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║   📥 SAVE ADMIN TOKEN API HIT              ║");
  console.log("╚════════════════════════════════════════════╝\n");

  try {
    // ===============================
    // STEP 1: LOG REQUEST DETAILS
    // ===============================
    console.log("▶️  STEP 1: REQUEST INSPECTION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Request Method:", req.method);
    console.log("🌐 Request URL:", req.url);
    console.log("📍 Full Path:", req.originalUrl);
    
    console.log("\n📨 HEADERS:");
    Object.keys(req.headers).forEach(key => {
      console.log(`   ${key}: ${req.headers[key]}`);
    });
    
    console.log("\n📦 RAW BODY:");
    console.log("   Type:", typeof req.body);
    console.log("   Is null?:", req.body === null);
    console.log("   Is undefined?:", req.body === undefined);
    console.log("   Is object?:", typeof req.body === 'object');
    console.log("   Content:", req.body);
    
    if (req.body) {
      console.log("\n🔍 BODY PROPERTIES:");
      console.log("   Keys:", Object.keys(req.body));
      console.log("   Key count:", Object.keys(req.body).length);
      
      Object.keys(req.body).forEach(key => {
        const value = req.body[key];
        console.log(`   ${key}:`, typeof value, `(length: ${value?.length || 'N/A'})`);
      });
    }
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // ===============================
    // STEP 2: EXTRACT TOKEN
    // ===============================
    console.log("▶️  STEP 2: TOKEN EXTRACTION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const { token } = req.body || {};
    
    console.log("🔍 Token extracted:", token ? "YES ✅" : "NO ❌");
    
    if (!token) {
      console.error("\n❌❌❌ TOKEN MISSING ❌❌❌");
      console.error("Expected: req.body.token");
      console.error("Received body:", req.body);
      console.error("\n💡 POSSIBLE CAUSES:");
      console.error("   1. Frontend not sending token in body");
      console.error("   2. express.json() middleware missing");
      console.error("   3. CORS blocking the request");
      console.error("   4. Wrong Content-Type header");
      console.error("\n💡 REQUIRED MIDDLEWARE:");
      console.error("   app.use(express.json());");
      console.error("   app.use(express.urlencoded({ extended: true }));");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      
      return res.status(400).json({
        success: false,
        message: "Token missing from request body",
        debug: {
          bodyReceived: req.body,
          bodyType: typeof req.body,
          bodyKeys: req.body ? Object.keys(req.body) : [],
        }
      });
    }

    console.log("✅ Token found in request body");
    console.log("🔍 Token type:", typeof token);
    console.log("🔍 Token length:", token.length, "characters");
    console.log("🔍 Token (first 50):", token.substring(0, 50) + "...");
    console.log("🔍 Token (last 30):", "..." + token.substring(token.length - 30));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // ===============================
    // STEP 3: VALIDATE TOKEN
    // ===============================
    console.log("▶️  STEP 3: TOKEN VALIDATION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    if (typeof token !== 'string') {
      console.error("❌ Token is not a string");
      console.error("Type:", typeof token);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      
      return res.status(400).json({
        success: false,
        message: "Token must be a string",
        debug: {
          tokenType: typeof token,
        }
      });
    }
    
    if (token.length < 100) {
      console.error("❌ Token too short");
      console.error("Length:", token.length);
      console.error("Expected: 150+ characters");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      
      return res.status(400).json({
        success: false,
        message: "Invalid token format - too short",
        debug: {
          tokenLength: token.length,
          expectedMinimum: 100,
        }
      });
    }
    
    console.log("✅ Token validation passed");
    console.log("   - Is string: ✅");
    console.log("   - Length OK: ✅ (" + token.length + " chars)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // ===============================
    // STEP 4: FIRESTORE SAVE
    // ===============================
    console.log("▶️  STEP 4: FIRESTORE SAVE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔥 Preparing Firestore write...");
    console.log("📍 Collection: admin_tokens");
    console.log("📄 Document ID: (FCM token)");
    console.log("📝 Data: { createdAt, lastUpdated }");
    
    const saveData = {
      createdAt: new Date(),
      lastUpdated: new Date(),
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.connection.remoteAddress || 'unknown',
    };
    
    console.log("\n🔥 Writing to Firestore...");
    
    await db.collection("admin_tokens").doc(token).set(
      saveData,
      { merge: true }
    );
    
    console.log("✅ Firestore write completed");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // ===============================
    // STEP 5: VERIFY SAVE
    // ===============================
    console.log("▶️  STEP 5: VERIFICATION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 Reading document back from Firestore...");
    
    const verifyDoc = await db.collection("admin_tokens").doc(token).get();
    
    console.log("📄 Document exists?:", verifyDoc.exists);
    
    if (!verifyDoc.exists) {
      console.error("\n❌❌❌ VERIFICATION FAILED ❌❌❌");
      console.error("Token was written but cannot be read back");
      console.error("\n💡 POSSIBLE CAUSES:");
      console.error("   1. Firestore security rules blocking read");
      console.error("   2. Firestore write failed silently");
      console.error("   3. Network/connection issue");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      
      throw new Error("Token not found after save - verification failed");
    }
    
    console.log("✅ Document verified in Firestore");
    console.log("\n📄 Saved Data:");
    const savedData = verifyDoc.data();
    Object.keys(savedData).forEach(key => {
      const value = savedData[key];
      if (value && value.toDate) {
        console.log(`   ${key}:`, value.toDate().toISOString());
      } else {
        console.log(`   ${key}:`, value);
      }
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // ===============================
    // STEP 6: COUNT ALL TOKENS
    // ===============================
    console.log("▶️  STEP 6: TOKEN COUNT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Counting all admin tokens...");
    
    const allTokensSnap = await db.collection("admin_tokens").get();
    const totalTokens = allTokensSnap.docs.length;
    
    console.log("✅ Total tokens in database:", totalTokens);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // ===============================
    // FINAL SUCCESS RESPONSE
    // ===============================
    console.log("╔════════════════════════════════════════════╗");
    console.log("║  ✅✅✅ TOKEN SAVE SUCCESSFUL ✅✅✅        ║");
    console.log("╚════════════════════════════════════════════╝\n");
    console.log("📊 SUMMARY:");
    console.log("   ✅ Token received from frontend");
    console.log("   ✅ Token validated");
    console.log("   ✅ Saved to Firestore");
    console.log("   ✅ Verified in database");
    console.log("   📊 Total active tokens:", totalTokens);
    console.log("\n💡 Next: Admin will receive safety notifications");
    console.log("═══════════════════════════════════════════════\n");

    return res.json({
      success: true,
      message: "Token stored successfully",
      debug: {
        tokenLength: token.length,
        totalTokens: totalTokens,
        savedAt: new Date().toISOString(),
      }
    });

  } catch (err) {
    console.error("\n╔════════════════════════════════════════════╗");
    console.error("║  ❌❌❌ SAVE TOKEN ERROR ❌❌❌            ║");
    console.error("╚════════════════════════════════════════════╝\n");
    
    console.error("🔴 Error Type:", err.name);
    console.error("🔴 Error Message:", err.message);
    console.error("🔴 Error Code:", err.code || 'N/A');
    console.error("\n📚 Error Stack:");
    console.error(err.stack);
    
    console.error("\n💡 TROUBLESHOOTING STEPS:");
    console.error("   1. Check Firestore security rules");
    console.error("   2. Verify Firebase Admin SDK is initialized");
    console.error("   3. Check service account credentials");
    console.error("   4. Verify network connectivity");
    console.error("═══════════════════════════════════════════════\n");

    return res.status(500).json({
      success: false,
      message: err.message,
      error: {
        name: err.name,
        code: err.code,
      }
    });
  }
};


