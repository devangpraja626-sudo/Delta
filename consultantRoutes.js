const express = require("express");
const router = express.Router();
const {
  searchFounders,
  createConsultancy,
  updateConsultancy,
  getMyConsultancy,
  searchInvestors,
  upsertResume,
  getMyResume,
} = require("../controllers/consultantController");
const { protect, restrictTo, requireOnboardingComplete } = require("../middleware/auth");

router.use(protect, restrictTo("consultant"), requireOnboardingComplete);

// Connect with founders (search first, then use /api/connections/request to connect)
router.get("/search/founders", searchFounders);

// Create your own consultancy
router.post("/consultancy", createConsultancy);
router.put("/consultancy/:id", updateConsultancy);
router.get("/consultancy/mine", getMyConsultancy);

// Search for investors
router.get("/search/investors", searchInvestors);

// Consultant resume
router.put("/resume", upsertResume);
router.get("/resume/mine", getMyResume);

module.exports = router;
