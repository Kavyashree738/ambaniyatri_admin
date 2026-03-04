const RideChat = require("../models/chat.model");
// SAVE MESSAGE (used by socket)
exports.saveMessage = async (rideId, data) => {
  console.log("\n==============================");
  console.log("💬 SAVE MESSAGE CALLED");
  console.log("Ride ID:", rideId);
  console.log("Message data:", data);
  console.log("==============================");

  try {
    let chat = await RideChat.findOne({ rideId });

    if (!chat) {
      console.log("📦 Creating new chat document...");
      chat = new RideChat({
        rideId,
        messages: [],
      });
    }

    chat.messages.push(data);

    console.log("💾 Saving to MongoDB...");
    await chat.save();

    console.log("✅ Message saved successfully\n");

  } catch (err) {
    console.log("❌ SAVE MESSAGE ERROR:", err, "\n");
  }
};

// FETCH CHAT HISTORY


exports.getChat = async (req, res) => {
  console.log("\n==============================");
  console.log("📥 FETCH CHAT REQUEST");
  console.log("Params:", req.params);
  console.log("==============================");

  try {
    const { rideId } = req.params;

    if (!rideId) {
      console.log("❌ Missing rideId");
      return res.status(400).json({
        error: "rideId required",
      });
    }

    console.log("🔍 Searching chat in MongoDB...");

    const chat = await RideChat.findOne({ rideId });

    if (!chat) {
      console.log("⚠ No chat found → returning empty list\n");

      return res.json({
        rideId,
        messages: [],
      });
    }

    console.log(
      `✅ Chat found — ${chat.messages.length} messages\n`
    );

    res.json(chat);

  } catch (err) {
    console.log("❌ FETCH CHAT ERROR:", err, "\n");

    res.status(500).json({
      error: "Server error",
    });
  }
};



// DELETE CHAT (after ride completes)

exports.deleteChat = async (req, res) => {
  console.log("\n==============================");
  console.log("🗑 DELETE CHAT REQUEST");
  console.log("Params:", req.params);
  console.log("==============================");

  try {
    const { rideId } = req.params;

    if (!rideId) {
      console.log("❌ Missing rideId");
      return res.status(400).json({
        error: "rideId required",
      });
    }

    console.log("🧹 Deleting chat from MongoDB...");

    const result = await RideChat.deleteOne({ rideId });

    console.log("Delete result:", result);

    console.log("✅ Chat deleted successfully\n");

    res.json({
      success: true,
      deleted: result.deletedCount,
    });

  } catch (err) {
    console.log("❌ DELETE CHAT ERROR:", err, "\n");

    res.status(500).json({
      error: "Server error",
    });
  }
};
