const mongoose = require("mongoose");

/**
 * "Create your own consultancy" - a service/agency profile a consultant
 * can set up and have founders/investors discover.
 */
const consultancySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 3000 },
    servicesOffered: [{ type: String }], // e.g. ["Legal", "Fundraising", "Product Strategy"]
    domainsFocus: [{ type: String }], // industries they specialize in
    pricingModel: { type: String }, // e.g. "Hourly", "Retainer", "Equity-based"
    website: { type: String },
    logoUrl: { type: String },

    teamSize: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

consultancySchema.index({ name: "text", description: "text", servicesOffered: "text" });

module.exports = mongoose.model("Consultancy", consultancySchema);
