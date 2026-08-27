const express = require("express");
const router = express.Router();
const {
  selectRole,
  submitProfileDetails,
  submitIdVerification,
  reviewIdVerification,
  getOnboardingStatus,
} = require("../controllers/onboardingController");
const { protect } = require("../middleware/auth");
const { uploadId } = require("../middleware/upload");

router.use(protect);

// Interface 1: role selection
router.post("/role", selectRole);

// Interface 2: person details + vision
router.post("/profile", submitProfileDetails);

// Interface 3: government ID proof
router.post(
  "/id-verification",
  uploadId.fields([
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  submitIdVerification
);

// Admin review of a submitted ID (protect this further with an admin-only check in production)
router.patch("/admin/review/:userId", reviewIdVerification);

router.get("/status", getOnboardingStatus);

module.exports = router;
