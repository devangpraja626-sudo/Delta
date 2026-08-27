const User = require("../models/User");
const Profile = require("../models/Profile");
const IdVerification = require("../models/IdVerification");

/**
 * INTERFACE 1: "I am a Founder / Consultant / Investor"
 * @route POST /api/onboarding/role
 */
exports.selectRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["founder", "consultant", "investor"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${allowedRoles.join(", ")}`,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { role, onboardingStage: "profile_details" },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Role saved. Proceed to profile details.",
      nextStep: "profile_details",
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * INTERFACE 2: person details + their vision for joining the platform
 * @route POST /api/onboarding/profile
 */
exports.submitProfileDetails = async (req, res) => {
  try {
    if (!req.user.role) {
      return res.status(400).json({ success: false, message: "Select a role first" });
    }

    const {
      fullName,
      phone,
      location,
      dateOfBirth,
      vision,
      bio,
      linkedIn,
      website,
      founderDetails,
      consultantDetails,
      investorDetails,
    } = req.body;

    if (!fullName || !phone || !vision) {
      return res.status(400).json({
        success: false,
        message: "fullName, phone, and vision are required",
      });
    }

    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      {
        user: req.user.id,
        fullName,
        phone,
        location,
        dateOfBirth,
        vision,
        bio,
        linkedIn,
        website,
        ...(req.user.role === "founder" && { founderDetails }),
        ...(req.user.role === "consultant" && { consultantDetails }),
        ...(req.user.role === "investor" && { investorDetails }),
      },
      { new: true, upsert: true, runValidators: true }
    );

    await User.findByIdAndUpdate(req.user.id, { onboardingStage: "id_verification" });

    res.status(200).json({
      success: true,
      message: "Profile saved. Proceed to government ID verification.",
      nextStep: "id_verification",
      profile,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * INTERFACE 3: valid government ID documentation proof
 * @route POST /api/onboarding/id-verification
 * (expects multipart/form-data: documentFront, documentBack?, selfie?)
 */
exports.submitIdVerification = async (req, res) => {
  try {
    const { idType, idNumber } = req.body;

    if (!idType || !idNumber) {
      return res.status(400).json({ success: false, message: "idType and idNumber are required" });
    }
    if (!req.files || !req.files.documentFront) {
      return res.status(400).json({ success: false, message: "Front-side ID document image/PDF is required" });
    }

    const documentFrontUrl = `/uploads/ids/${req.files.documentFront[0].filename}`;
    const documentBackUrl = req.files.documentBack
      ? `/uploads/ids/${req.files.documentBack[0].filename}`
      : undefined;
    const selfieUrl = req.files.selfie ? `/uploads/ids/${req.files.selfie[0].filename}` : undefined;

    const idVerification = await IdVerification.findOneAndUpdate(
      { user: req.user.id },
      {
        user: req.user.id,
        idType,
        idNumber,
        documentFrontUrl,
        documentBackUrl,
        selfieUrl,
        status: "pending", // an admin/reviewer approves this later
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Onboarding flow marks "id_verification" step as submitted.
    // Full "completed" status is normally set once an admin approves it via
    // PATCH /api/onboarding/admin/review/:userId (see reviewIdVerification below).
    // AUTO_APPROVE is on here so the bundled frontend demo can be walked through
    // end-to-end without a separate admin step — turn it off for production and
    // wire up real manual/KYC-provider review instead.
    const AUTO_APPROVE = true;
    if (AUTO_APPROVE) {
      idVerification.status = "approved";
      await idVerification.save();
      await User.findByIdAndUpdate(req.user.id, {
        onboardingStage: "completed",
        isVerified: true,
      });
    }

    res.status(200).json({
      success: true,
      message: AUTO_APPROVE
        ? "ID verified. Onboarding complete!"
        : "ID submitted for review. You'll be notified once approved.",
      idVerification,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Admin action: approve/reject a submitted government ID.
 * @route PATCH /api/onboarding/admin/review/:userId
 */
exports.reviewIdVerification = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body; // "approved" | "rejected"
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be approved or rejected" });
    }

    const idVerification = await IdVerification.findOneAndUpdate(
      { user: req.params.userId },
      {
        status,
        rejectionReason: status === "rejected" ? rejectionReason : undefined,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!idVerification) {
      return res.status(404).json({ success: false, message: "ID verification record not found" });
    }

    if (status === "approved") {
      await User.findByIdAndUpdate(req.params.userId, {
        onboardingStage: "completed",
        isVerified: true,
      });
    }

    res.status(200).json({ success: true, idVerification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/onboarding/status
exports.getOnboardingStatus = async (req, res) => {
  res.status(200).json({
    success: true,
    role: req.user.role,
    onboardingStage: req.user.onboardingStage,
    isVerified: req.user.isVerified,
  });
};
