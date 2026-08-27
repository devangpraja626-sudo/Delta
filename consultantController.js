const Consultancy = require("../models/Consultancy");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Pitch = require("../models/Pitch");

// ---------- Search / browse founders (to connect & offer help) ----------

// @route GET /api/consultant/search/founders?domain=Fintech&stage=mvp&q=keyword
exports.searchFounders = async (req, res) => {
  const { domain, stage, isTechStartup, q } = req.query;

  const query = { isPublished: true };
  if (domain) query.domain = domain;
  if (stage) query.stage = stage;
  if (isTechStartup !== undefined) query.isTechStartup = isTechStartup === "true";
  if (q) query.$text = { $search: q };

  const pitches = await Pitch.find(query).populate("founder", "email role isVerified").sort("-createdAt");
  res.status(200).json({ success: true, count: pitches.length, founders: pitches });
};

// ---------- Create your own consultancy ----------

// @route POST /api/consultant/consultancy
exports.createConsultancy = async (req, res) => {
  try {
    const consultancy = await Consultancy.create({ ...req.body, owner: req.user.id });
    res.status(201).json({ success: true, consultancy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/consultant/consultancy/:id
exports.updateConsultancy = async (req, res) => {
  try {
    const consultancy = await Consultancy.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!consultancy) return res.status(404).json({ success: false, message: "Consultancy not found" });
    res.status(200).json({ success: true, consultancy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/consultant/consultancy/mine
exports.getMyConsultancy = async (req, res) => {
  const consultancy = await Consultancy.find({ owner: req.user.id });
  res.status(200).json({ success: true, consultancy });
};

// ---------- Search investors ----------

// @route GET /api/consultant/search/investors?domain=Fintech&q=keyword
exports.searchInvestors = async (req, res) => {
  const { domain, q } = req.query;

  const investorUsers = await User.find({ role: "investor", onboardingStage: "completed" }).select("_id");
  const userIds = investorUsers.map((u) => u._id);

  const profileQuery = { user: { $in: userIds } };
  if (domain) profileQuery["investorDetails.preferredDomains"] = domain;
  if (q) profileQuery.$text = { $search: q };

  const profiles = await Profile.find(profileQuery).populate("user", "email role isVerified");
  res.status(200).json({ success: true, count: profiles.length, investors: profiles });
};

// ---------- Consultant Resume (reuses Portfolio model with type "resume") ----------

// @route PUT /api/consultant/resume
exports.upsertResume = async (req, res) => {
  try {
    const resume = await Portfolio.findOneAndUpdate(
      { user: req.user.id },
      { ...req.body, type: "resume", user: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/consultant/resume/mine
exports.getMyResume = async (req, res) => {
  const resume = await Portfolio.findOne({ user: req.user.id });
  res.status(200).json({ success: true, resume });
};
