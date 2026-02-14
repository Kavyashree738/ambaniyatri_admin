const { db } = require("../config/firebaseAdmin");
const { sendSafetyAlert } = require("./fcm.service");

// ===============================
// 📏 Distance Calculator
// ===============================
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===============================
// 🚨 REALTIME SAFETY CHECK
// ===============================
async function checkDriverSafety(driverId, driverData) {
  try {
    console.log(`\n🔍 Checking safety for driver: ${driverId}`);
    
    const driverLat = driverData.point?.geopoint?.latitude;
    const driverLng = driverData.point?.geopoint?.longitude;

    console.log(`📍 Driver location: ${driverLat}, ${driverLng}`);

    if (!driverLat || !driverLng) {
      console.log("❌ No driver location available");
      return;
    }

    // ✅ FIXED: Use user reference instead of driver reference
    // The accepted_by field points to /users collection
    const userRef = db.doc(`users/${driverId}`);
    
    console.log(`🔎 Looking for started rides for user ${driverId}...`);

    const rideSnap = await db
      .collection("rides")
      .where("accepted_by", "==", userRef)
      .where("status", "==", "started")
      .limit(1)
      .get();

    console.log(`📦 Found ${rideSnap.docs.length} started ride(s)`);

    if (rideSnap.empty) {
      console.log("⚠️ No started ride found for this driver");
      return;
    }

    const rideDoc = rideSnap.docs[0];
    const ride = rideDoc.data();

    console.log(`✅ Found ride: ${rideDoc.id}`);
    console.log(`📊 Ride status: ${ride.status}`);

    const dropLat = ride.to?.point?.geopoint?.latitude;
    const dropLng = ride.to?.point?.geopoint?.longitude;

    console.log(`🎯 Drop location: ${dropLat}, ${dropLng}`);

    if (!dropLat || !dropLng) {
      console.log("❌ No drop location in ride");
      return;
    }

    const distance = distanceMeters(
      driverLat,
      driverLng,
      dropLat,
      dropLng
    );

    console.log(`📏 Distance from drop: ${distance.toFixed(2)}m`);

    if (distance <= 1000) {
      console.log("✅ Driver within safe range (≤ 1000m)");
      return;
    }

    console.log(`⚠️ Driver is ${distance.toFixed(2)}m away from drop!`);

    const alertCount = ride.safety_alert_count || 0;
    console.log(`🔢 Current alert count: ${alertCount}`);

    if (alertCount >= 2) {
      console.log("⛔ Alert limit reached (2 alerts already sent)");
      return;
    }

    console.log("🚨 TRIGGERING SAFETY ALERT!");

    await sendSafetyAlert(rideDoc.id);

    await rideDoc.ref.update({
      safety_flag: true,
      safety_reason: "Driver deviated from drop",
      safety_time: new Date(),
      safety_alert_count: alertCount + 1,
    });

    console.log("✅ Firestore updated with safety alert");
    console.log(`📊 New alert count: ${alertCount + 1}`);
  } catch (err) {
    console.error("❌ Realtime safety error:", err);
    console.error("Stack:", err.stack);
  }
}

// ===============================
// 👂 START REALTIME LISTENER
// ===============================
function startSafetyListener() {
  console.log("🚀 Starting realtime safety listener...");

  // ✅ OPTION A: Filter only by current_ride_id (recommended)
  db.collection("drivers")
    .where("current_ride_id", "!=", null)
    .onSnapshot(
      (snapshot) => {
        console.log(`📡 Snapshot received: ${snapshot.docs.length} drivers`);
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            const driverId = change.doc.id;
            const driverData = change.doc.data();

            // ✅ Filter isActive in code instead
            if (driverData.isActive === false) {
              console.log(`🔄 Driver ${driverId} location updated`);
              checkDriverSafety(driverId, driverData);
            }
          }
        });
      },
      (error) => {
        console.error("❌ Snapshot listener error:", error);
      }
    );
  
  console.log("✅ Safety listener active");
}

module.exports = { startSafetyListener };
