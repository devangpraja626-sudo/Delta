require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const founderRoutes = require("./routes/founderRoutes");
const consultantRoutes = require("./routes/consultantRoutes");
const investorRoutes = require("./routes/investorRoutes");
const connectionRoutes = require("./routes/connectionRoutes");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded ID documents / resumes (lock this down behind auth in production)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve the frontend (public/index.html + app.js) — same origin as the API,
// so the browser can call /api/* with no CORS/config needed.
app.use(express.static(path.join(__dirname, "public")));

// ---- API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes); // Interfaces 1, 2, 3
app.use("/api/founder", founderRoutes); // Founder dashboard
app.use("/api/consultant", consultantRoutes); // Consultant dashboard
app.use("/api/investor", investorRoutes); // Investor dashboard
app.use("/api/connections", connectionRoutes); // Shared connect feature

// Any non-API, non-file route falls back to the frontend (single-page app)
app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 handler for unmatched /api routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Delta backend running on port ${PORT}`));
