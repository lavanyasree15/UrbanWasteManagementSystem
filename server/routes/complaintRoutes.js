
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  createComplaint,
  getMyComplaints,
  updateComplaintStatus,
  getAllComplaints,
  assignWorker,
  getAssignedComplaints,
  getWorkers,
  completeComplaint,
  updateWorkerComplaintStatus
} = require("../controllers/complaintController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Create uploads folder automatically if it doesn't exist
const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post(
  "/",
  authMiddleware,
  upload.single("photo"),
  createComplaint
);

router.get("/my", authMiddleware, getMyComplaints);

router.get(
  "/all",
  authMiddleware,
  adminMiddleware,
  getAllComplaints
);

router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  updateComplaintStatus
);
router.patch(
  "/:id/worker-status",
  authMiddleware,
  updateWorkerComplaintStatus
);

router.patch(
  "/:id/assign",
  authMiddleware,
  adminMiddleware,
  assignWorker
);

router.get(
  "/assigned",
  authMiddleware,
  getAssignedComplaints
);
router.patch(
  "/:id/complete",
  authMiddleware,
  upload.single("completionPhoto"),
  completeComplaint
);
router.get("/workers", authMiddleware, adminMiddleware, getWorkers);

module.exports = router;
