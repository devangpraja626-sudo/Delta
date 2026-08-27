const express = require("express");
const router = express.Router();
const {
  searchStartups,
  getStartupDetail,
  getAvailableDomains,
  searchConsultants,
} = require("../controllers/investorController");
const { protect, restrictTo, requireOnboardingComplete } = require("../middleware/auth");

router.use(protect, restrictTo("investor"), requireOnboardingComplete);

// Search for startup preference: tech / non-tech, and different domains
router.get("/search/startups", searchStartups);
router.get("/startups/:id", getStartupDetail);
router.get("/domains", getAvailableDomains);

// Also allow investors to search for consultants if needed
router.get("/search/consultants", searchConsultants);

module.exports = router;
