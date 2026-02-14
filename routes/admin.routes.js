const express = require("express");
const router = express.Router();

const { getDriversOnRide,getRideDetails ,saveAdminToken} = require("../controllers/admin.controller");

// GET /api/admin/drivers/on-ride
router.get("/drivers/on-ride", getDriversOnRide);
router.get("/ride/:rideId", getRideDetails);
router.post("/save-token", saveAdminToken);

module.exports = router;

