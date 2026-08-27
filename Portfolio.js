const mongoose = require("mongoose");

/**
 * Used by founders ("create your portfolio or resume") and consultants
 * ("consultant resume") to showcase their background.
 */
const portfolioSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    type: { type: String, enum: ["portfolio", "resume"], required: true },

    headline: { type: String, maxlength: 150 },
    summary: { type: String, maxlength: 2000 },

    skills: [{ type: String }],
    experience: [
      {
        title: String,
        organization: String,
        startDate: Date,
        endDate: Date,
        current: Boolean,
        description: String,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startYear: Number,
        endYear: Number,
      },
    ],
    projects: [
      {
        title: String,
        description: String,
        link: String,
      },
    ],
    resumeFileUrl: { type: String }, // uploaded PDF/doc resume
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Portfolio", portfolioSchema);
