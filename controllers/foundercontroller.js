const Pitch = require("../models/Pitch");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User");
const Profile = require("../models/Profile");

// ---------- Pitch your idea ----------

// @route POST /api/founder/pitch
exports.createPitch = async (req, res) => {
  try {
    const pitch = await Pitch.create({ ...req.body, founder: req.user.id });
    res.status(201).json({ success: true, pitch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/founder/pitch/:id
exports.updatePitch = async (req, res) => {
  try {
    const pitch = await Pitch.findOneAndUpdate(
      { _id: req.params.id, founder: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!pitch) return res.status(404).json({ success: false, message: "Pitch not found" });
    res.status(200).json({ success: true, pitch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/founder/pitch/mine
exports.getMyPitches = async (req, res) => {
  const pitches = await Pitch.find({ founder: req.user.id }).sort("-createdAt");
  res.status(200).json({ success: true, count: pitches.length, pitches });
};

// @route DELETE /api/founder/pitch/:id
exports.deletePitch = async (req, res) => {
  const pitch = await Pitch.findOneAndDelete({ _id: req.params.id, founder: req.user.id });
  if (!pitch) return res.status(404).json({ success: false, message: "Pitch not found" });
  res.status(200).json({ success: true, message: "Pitch deleted" });
};

// ---------- Search investors & consultants ----------

// @route GET /api/founder/search/investors?domain=Fintech&investorType=vc&q=keyword
exports.searchInvestors = async (req, res) => {
  const { domain, investorType, q } = req.query;

  const userQuery = { role: "investor", onboardingStage: "completed" };
  const investorUsers = await User.find(userQuery).select("_id");
  const userIds = investorUsers.map((u) => u._id);

  const profileQuery = { user: { $in: userIds } };
  if (domain) profileQuery["investorDetails.preferredDomains"] = domain;
  if (investorType) profileQuery["investorDetails.investorType"] = investorType;
  if (q) profileQuery.$text = { $search: q };

  const profiles = await Profile.find(profileQuery).populate("user", "email role isVerified");
  res.status(200).json({ success: true, count: profiles.length, investors: profiles });
};

// @route GET /api/founder/search/consultants?expertise=Marketing&q=keyword
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

// ---------- Portfolio / Resume ----------

// @route PUT /api/founder/portfolio  (create or update)
exports.upsertPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { user: req.user.id },
      { ...req.body, user: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ success: true, portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/founder/portfolio/mine
exports.getMyPortfolio = async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.user.id });
  res.status(200).json({ success: true, portfolio });
};