const mongoose = require("mongoose");

/**
 * Step 2 ("Interface 2"): person details + their vision for joining the platform.
 * Shared shape across all three roles, with role-specific optional fields.
 */
const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    location: { type: String },
    dateOfBirth: { type: Date },

    // Why they're joining / what they hope to achieve
    vision: { type: String, required: true, maxlength: 2000 },

    // Role-specific context, all optional depending on role
    founderDetails: {
      startupName: String,
      startupStage: { type: String, enum: ["idea", "mvp", "early_traction", "growth"] },
      domain: String, // e.g. Fintech, HealthTech
      isTechStartup: Boolean,
    },
    consultantDetails: {
      expertiseAreas: [String], // e.g. ["Marketing", "Legal", "Product"]
      yearsOfExperience: Number,
      consultancyName: String,
    },
    investorDetails: {
      investorType: { type: String, enum: ["angel", "vc", "family_office", "corporate"] },
      preferredDomains: [String], // e.g. ["Tech", "Non-Tech", "Fintech"]
      ticketSize: String, // e.g. "$10k - $50k"
    },

    profilePicture: { type: String },
    bio: { type: String, maxlength: 1000 },
    linkedIn: { type: String },
    website: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
