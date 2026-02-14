const { db } = require("../config/firebaseAdmin");
const { sendSafetyAlert } = require("./fcm.service");

//
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

let running = false;

//
// ===============================
// 🚨 SAFETY MONITOR
// ===============================
async function monitorRideSafety() {
  if (running) {
    console.log("⏳ Monitor already running — skip");
    return;
  }

  running = true;

  try {
    console.log("\n==============================");
    console.log("🛡 SAFETY MONITOR STARTED");
    console.log("==============================");

    const ridesSnap = await db
      .collection("rides")
      .where("status", "==", "started")
      .get();

    console.log("📦 Active rides found:", ridesSnap.docs.length);

    for (const rideDoc of ridesSnap.docs) {
      const ride = rideDoc.data();

      console.log("\n🚕 Checking ride:", rideDoc.id);

      if (!ride.accepted_by) {
        console.log("❌ No driver reference");
        continue;
      }

      const driverDoc = await db
        .collection("drivers")
        .doc(ride.accepted_by.id)
        .get();

      if (!driverDoc.exists) {
        console.log("❌ Driver doc missing");
        continue;
      }

      const driver = driverDoc.data();

      const driverLat = driver.point?.geopoint?.latitude;
      const driverLng = driver.point?.geopoint?.longitude;

      const dropLat = ride.to?.point?.geopoint?.latitude;
      const dropLng = ride.to?.point?.geopoint?.longitude;

      if (!driverLat || !driverLng || !dropLat || !dropLng) {
        console.log("⚠ Missing GPS — skipping");
        continue;
      }

      const distance = distanceMeters(
        driverLat,
        driverLng,
        dropLat,
        dropLng
      );

      console.log("📏 Distance:", distance, "meters");

      if (distance <= 1000) {
        console.log("✅ Driver safe");
        continue;
      }

      console.log("🚨 SAFETY ALERT CONDITION MET");

      // =========================
      // ALERT LIMIT LOGIC
      // =========================
      const alertCount = ride.safety_alert_count || 0;

      console.log("🔢 Current alert count:", alertCount);

      if (alertCount >= 2) {
        console.log("⛔ Alert limit reached — skipping notification");
        continue;
      }

      console.log("📢 Sending admin notification…");

      await sendSafetyAlert(rideDoc.id);

      console.log("✅ Notification sent");

      // =========================
      // Update Firestore
      // =========================
      await rideDoc.ref.update({
        safety_flag: true,
        safety_reason: "Driver deviated from drop",
        safety_time: new Date(),
        safety_alert_count: alertCount + 1,
      });

      console.log("🔥 Firestore updated with alert count");
    }

    console.log("\n🟢 SAFETY MONITOR FINISHED\n");
  } catch (err) {
    console.error("❌ SAFETY ERROR:", err);
  }

  running = false;
}

module.exports = { monitorRideSafety };
