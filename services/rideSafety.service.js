const { db } = require("../config/firebaseAdmin");

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

    if (ridesSnap.empty) {
      console.log("⚠ No STARTED rides found");
    }

    for (const rideDoc of ridesSnap.docs) {
      const ride = rideDoc.data();

      console.log("\n🚕 Checking ride:", rideDoc.id);

      if (!ride.accepted_by) {
        console.log("❌ No driver reference");
        continue;
      }

      console.log("👉 Fetching driver doc...");

      const driverId = ride.accepted_by.id;

      const driverDoc = await db.collection("drivers").doc(driverId).get();

      if (!driverDoc.exists) {
        console.log("❌ Driver doc missing");
        continue;
      }

      const driver = driverDoc.data();

      console.log("📍 Driver data:", driver.point);

      const driverLat = driver.point?.geopoint?.latitude;
      const driverLng = driver.point?.geopoint?.longitude;

      const dropLat = ride.to?.point?.geopoint?.latitude;
      const dropLng = ride.to?.point?.geopoint?.longitude;

      console.log("Driver GPS:", driverLat, driverLng);
      console.log("Drop GPS:", dropLat, dropLng);

      if (
        driverLat == null ||
        driverLng == null ||
        dropLat == null ||
        dropLng == null
      ) {
        console.log("⚠ Missing GPS — skipping");
        continue;
      }

      const distance = distanceMeters(driverLat, driverLng, dropLat, dropLng);

      console.log("📏 Distance:", distance, "meters");

      if (distance > 500) {
        console.log("🚨 DISTANCE > 500m — SHOULD ALERT");

        if (!ride.safety_flag) {
          console.log("🔥 Writing safety flag to Firestore...");

          await rideDoc.ref.update({
            safety_flag: true,
            safety_reason: "Driver deviated from drop",
            safety_time: new Date(),
          });

          console.log("✅ Firestore updated!");
        } else {
          console.log("ℹ Already flagged — skipping write");
        }
      } else {
        console.log("✅ Driver safe — within range");
      }
    }

    console.log("\n🟢 SAFETY MONITOR FINISHED\n");
  } catch (err) {
    console.error("❌ SAFETY ERROR:", err);
  }

  running = false;
}

module.exports = { monitorRideSafety };
