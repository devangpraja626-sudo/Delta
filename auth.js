const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT and attaches the user to req.user
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Not authorized, token invalid" });
  }
};

// Restricts a route to specific roles, e.g. restrictTo("founder", "investor")
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!req.user.role || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You do not have access to this resource" });
  }
  next();
};

// Ensures the user has completed all 3 onboarding steps (incl. ID verification)
// before they can use the main platform features (pitching, connecting, etc.)
exports.requireOnboardingComplete = (req, res, next) => {
  if (req.user.onboardingStage !== "completed") {
    return res.status(403).json({
      success: false,
      message: "Please complete onboarding (profile details + ID verification) first",
      onboardingStage: req.user.onboardingStage,
    });
  }
  next();
};
