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

      const lat = x.point?.geopoint?.latitude ?? null;
      const lng = x.point?.geopoint?.longitude ?? null;

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
