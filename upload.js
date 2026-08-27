const multer = require("multer");
const path = require("path");
const fs = require("fs");

const makeStorage = (subfolder) => {
  const dir = path.join(__dirname, "..", "uploads", subfolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const unique = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, unique);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const isAllowed =
    allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
  if (isAllowed) return cb(null, true);
  cb(new Error("Only jpg, jpeg, png, and pdf files are allowed"));
};

exports.uploadId = multer({
  storage: makeStorage("ids"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

exports.uploadResume = multer({
  storage: makeStorage("resumes"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
