const mongoose = require("mongoose");

/**
 * Step 3 ("Interface 3"): government ID documentation proof.
 * Stores the uploaded document reference and its review status.
 * NOTE: In production, store files in encrypted cloud storage (e.g. S3 with
 * server-side encryption) rather than local disk, and restrict access to
 * verification admins only.
 */
const idVerificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    idType: {
      type: String,
      enum: ["passport", "national_id", "driving_license", "voter_id", "aadhar", "other"],
      required: true,
    },
    idNumber: { type: String, required: true }, // consider encrypting at rest
    documentFrontUrl: { type: String, required: true },
    documentBackUrl: { type: String },
    selfieUrl: { type: String }, // optional liveness/selfie-match photo

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IdVerification", idVerificationSchema);
