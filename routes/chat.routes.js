const express = require("express");
const router = express.Router();
const controller = require("../controllers/chat.controller");

router.get("/:rideId", controller.getChat);
router.delete("/:rideId", controller.deleteChat);

module.exports = router;
