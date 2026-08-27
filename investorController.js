const Pitch = require("../models/Pitch");
const Profile = require("../models/Profile");
const User = require("../models/User");

/**
 * Search for startup pitches matching the investor's preferences.
 * @route GET /api/investor/search/startups
 * Query params:
 *   isTechStartup=true|false   - tech vs non-tech
 *   domain=Fintech             - specific domain
 *   stage=mvp                  - idea | mvp | early_traction | growth
 *   q=keyword                  - free-text search (name/description/tags)
 *   sort=views|-createdAt      - sorting (default: newest first)
 */
exports.searchStartups = async (req, res) => {
  try {
    const { isTechStartup, domain, stage, q, sort } = req.query;

    const query = { isPublished: true };
    if (isTechStartup !== undefined) query.isTechStartup = isTechStartup === "true";
    if (domain) query.domain = domain;
    if (stage) query.stage = stage;
    if (q) query.$text = { $search: q };

    const pitches = await Pitch.find(query)
      .populate("founder", "email role isVerified")
      .sort(sort || "-createdAt");

    res.status(200).json({ success: true, count: pitches.length, startups: pitches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/investor/startups/:id
exports.getStartupDetail = async (req, res) => {
  const pitch = await Pitch.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate("founder", "email role isVerified");

  if (!pitch) return res.status(404).json({ success: false, message: "Pitch not found" });
  res.status(200).json({ success: true, startup: pitch });
};

// @route GET /api/investor/domains  - distinct list of available domains, for filter UI
exports.getAvailableDomains = async (req, res) => {
  const domains = await Pitch.distinct("domain", { isPublished: true });
  res.status(200).json({ success: true, domains });
};

// @route GET /api/investor/search/consultants?expertise=Legal&q=keyword
exports.searchConsultants = async (req, res) => {
  const { expertise, q } = req.query;

  const consultantUsers = await User.find({ role: "consultant", onboardingStage: "completed" }).select("_id");
  const userIds = consultantUsers.map((u) => u._id);

  const profileQuery = { user: { $in: userIds } };
  if (expertise) profileQuery["consultantDetails.expertiseAreas"] = expertise;
  if (q) profileQuery.$text = { $search: q };

  const profiles = await Profile.find(profileQuery).populate("user", "email role isVerified");
  res.status(200).json({ success: true, count: profiles.length, consultants: profiles });
};
