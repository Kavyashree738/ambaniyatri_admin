// socket/chat.js

const { db } = require("../config/firebaseAdmin");
const RideChat = require("../models/chat.model");

module.exports = function initChat(io) {
  console.log("🔥 Chat socket initialized");

  io.on("connection", (socket) => {
    console.log("\n========================");
    console.log("🔌 SOCKET CONNECTED:", socket.id);
    console.log("========================\n");

    // ===================================================
    // JOIN CHAT ROOM
    // ===================================================

    socket.on("joinRideChat", async (data) => {
      console.log("➡️ joinRideChat request:", data);

      try {
        const { rideId, role, accountId } = data;

        if (!rideId || !role || !accountId) {
          console.log("❌ Missing join data");
          socket.emit("chatError", {
            message: "Missing join data",
          });
          return;
        }

        // 🔥 verify ride
        console.log("🔍 Checking ride in Firestore...");
        // const rideDoc = await db.collection("rides").doc(rideId).get();

        // if (!rideDoc.exists) {
        //   console.log("❌ Ride not found");
        //   socket.emit("chatError", {
        //     message: "Ride not found",
        //   });
        //   return;
        // }

        // const ride = rideDoc.data();
        // console.log("📦 Ride status:", ride.status);

        // if (!["accepted", "started"].includes(ride.status)) {
        //   console.log("❌ Chat not allowed yet");
        //   socket.emit("chatError", {
        //     message: "Chat not allowed yet",
        //   });
        //   return;
        // }

        // ✅ Query by field instead of doc ID
        const rideQuery = await db
          .collection("rides")
          .where("id", "==", rideId)
          .limit(1)
          .get();

        // ✅ If still not found, try by doc ID as fallback
        let ride = null;
        if (!rideQuery.empty) {
          ride = rideQuery.docs[0].data();
        } else {
          const rideDoc = await db.collection("rides").doc(rideId).get();
          if (rideDoc.exists) {
            ride = rideDoc.data();
          }
        }

        if (!ride) {
          console.log("❌ Ride not found");
          socket.emit("chatError", { message: "Ride not found" });
          return;
        }

        if (!["accepted", "started"].includes(ride.status)) {
          console.log("❌ Chat not allowed — status:", ride.status);
          socket.emit("chatError", { message: "Chat not allowed yet" });
          return;
        }

        const room = `ride_${rideId}`;
        socket.join(room);

        socket.data.rideId = rideId;
        socket.data.role = role;
        socket.data.accountId = accountId;

        console.log("✅ Joined room:", room);

        socket.emit("joined", { room });
      } catch (e) {
        console.log("❌ joinRideChat ERROR:", e);
      }
    });

    // ===================================================
    // SEND MESSAGE
    // ===================================================

    socket.on("chatMessage", async (data) => {
      console.log("\n➡️ chatMessage received:", data);

      try {
        const { rideId, message, senderRole, senderId } = data;

        if (!rideId || !message) {
          console.log("⚠ Invalid message payload");
          return;
        }

        const msg = {
          message,
          senderRole,
          senderId,
          time: new Date(),
        };

        console.log("💾 Saving message to MongoDB...");

        let chat = await RideChat.findOne({ rideId });

        if (!chat) {
          console.log("📦 Creating new chat document");
          chat = new RideChat({
            rideId,
            messages: [],
          });
        }

        chat.messages.push(msg);
        await chat.save();

        console.log("✅ Message saved");

        // 🔥 broadcast live
        const room = `ride_${rideId}`;

        console.log("📡 Broadcasting to room:", room);

        io.to(room).emit("newMessage", msg);

        console.log("📤 Broadcast complete\n");
      } catch (e) {
        console.log("❌ chatMessage ERROR:", e);
      }
    });

    // ===================================================
    // DISCONNECT
    // ===================================================

    socket.on("disconnect", (reason) => {
      console.log("\n❌ SOCKET DISCONNECTED:", socket.id);
      console.log("Reason:", reason);
      console.log("========================\n");
    });
  });
};
