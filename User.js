const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },

    // ---- Step 1: role selection ("Interface 1") ----
    role: {
      type: String,
      enum: ["founder", "consultant", "investor"],
      default: null,
    },

    // Tracks how far the user has progressed through onboarding
    onboardingStage: {
      type: String,
      enum: ["role_selection", "profile_details", "id_verification", "completed"],
      default: "role_selection",
    },

    isVerified: { type: Boolean, default: false }, // set true once ID is approved
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
