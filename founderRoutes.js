const express = require("express");
const router = express.Router();
const {
  createPitch,
  updatePitch,
  getMyPitches,
  deletePitch,
  searchInvestors,
  searchConsultants,
  upsertPortfolio,
  getMyPortfolio,
} = require("../controllers/founderController");
const { protect, restrictTo, requireOnboardingComplete } = require("../middleware/auth");

router.use(protect, restrictTo("founder"), requireOnboardingComplete);

// Pitch your idea
router.post("/pitch", createPitch);
router.put("/pitch/:id", updatePitch);
router.get("/pitch/mine", getMyPitches);
router.delete("/pitch/:id", deletePitch);

// Search
router.get("/search/investors", searchInvestors);
router.get("/search/consultants", searchConsultants);

// Portfolio / resume
router.put("/portfolio", upsertPortfolio);
router.get("/portfolio/mine", getMyPortfolio);

module.exports = router;
