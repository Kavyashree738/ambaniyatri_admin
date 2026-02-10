const express = require("express");
const router = express.Router();

const { getDriversOnRide,getRideDetails } = require("../controllers/admin.controller");

// GET /api/admin/drivers/on-ride
router.get("/drivers/on-ride", getDriversOnRide);
router.get("/ride/:rideId", getRideDetails);

module.exports = router;
