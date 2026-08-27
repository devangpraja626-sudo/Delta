const express = require("express");
const router = express.Router();
const {
  sendRequest,
  respondToRequest,
  getMyConnections,
  getPendingRequests,
} = require("../controllers/connectionController");
const { protect, requireOnboardingComplete } = require("../middleware/auth");

router.use(protect, requireOnboardingComplete);

router.post("/request", sendRequest);
router.patch("/:id/respond", respondToRequest);
router.get("/mine", getMyConnections);
router.get("/pending", getPendingRequests);

module.exports = router;
