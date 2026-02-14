const admin = require("firebase-admin");
const { db } = require("../config/firebaseAdmin");

exports.sendSafetyAlert = async (rideId) => {
  console.log("\n🚨 ===== SAFETY ALERT PIPELINE START =====");

  try {
    // =========================
    // STEP 1 — Fetch tokens
    // =========================
    console.log("🔍 Fetching admin tokens...");

    const snap = await db.collection("admin_tokens").get();

    const tokens = snap.docs.map((d) => d.id);

    console.log("📦 Tokens found:", tokens.length);

    if (!tokens.length) {
      console.warn("⚠ No admin tokens available — cannot send alert");
      return;
    }

    // =========================
    // STEP 2 — Build payload
    // =========================
    const payload = {
      notification: {
        title: "🚨 Safety Alert",
        body: `Driver deviated from drop — Ride ${rideId}`,
      },
      data: {
        type: "safety",
        rideId: String(rideId),
      },
    };

    console.log("📨 Payload:", payload);

    // =========================
    // STEP 3 — Send FCM
    // =========================
    console.log("📡 Sending FCM multicast...");

    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      ...payload,
    });

    console.log("\n📢 FCM RESULT:");
    console.log("✅ Success count:", result.successCount);
    console.log("❌ Failure count:", result.failureCount);

    // =========================
    // STEP 4 — Detailed errors
    // =========================
    result.responses.forEach((resp, i) => {
      if (!resp.success) {
        console.error(
          `❌ Token failed →`,
          tokens[i],
          resp.error
        );
      }
    });

    console.log("🚨 ===== SAFETY ALERT PIPELINE END =====\n");

  } catch (err) {
    console.error("🔥 FCM SEND ERROR:", err);
  }
};
