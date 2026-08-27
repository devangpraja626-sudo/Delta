const mongoose = require("mongoose");

/**
 * Founders use this to pitch their startup idea.
 * Investors search/browse this; consultants can also view to offer help.
 */
const pitchSchema = new mongoose.Schema(
  {
    founder: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    startupName: { type: String, required: true, trim: true },
    tagline: { type: String, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },

    domain: { type: String, required: true, index: true }, // e.g. Fintech, EdTech, Agritech
    isTechStartup: { type: Boolean, default: true, index: true }, // tech vs non-tech
    stage: {
      type: String,
      enum: ["idea", "mvp", "early_traction", "growth"],
      default: "idea",
      index: true,
    },

    fundingAsk: { type: String }, // e.g. "$100,000 for 10% equity"
    pitchDeckUrl: { type: String },
    videoUrl: { type: String },
    tags: [{ type: String, index: true }],

    isPublished: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pitchSchema.index({ startupName: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Pitch", pitchSchema);
