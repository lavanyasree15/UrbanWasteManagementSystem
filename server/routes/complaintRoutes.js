
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

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

// Store uploaded images temporarily in memory
const storage = multer.memoryStorage();

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

// Upload image to Cloudinary
const uploadToCloudinary = (file) => {
  console.log("Cloudinary upload called:", file.originalname);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "ecotrack" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return reject(error);
        }

        console.log("Cloudinary URL:", result.secure_url);
        resolve(result.secure_url);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
};

// Make helper available to the complaint controller
router.use((req, res, next) => {
  req.uploadToCloudinary = uploadToCloudinary;
  next();
});

router.post("/", authMiddleware, upload.single("photo"), createComplaint);
router.get("/my", authMiddleware, getMyComplaints);
router.get("/all", authMiddleware, adminMiddleware, getAllComplaints);

router.patch("/:id/status", authMiddleware, adminMiddleware, updateComplaintStatus);
router.patch("/:id/worker-status", authMiddleware, updateWorkerComplaintStatus);
router.patch("/:id/assign", authMiddleware, adminMiddleware, assignWorker);

router.get("/assigned", authMiddleware, getAssignedComplaints);

router.patch(
  "/:id/complete",
  authMiddleware,
  upload.single("completionPhoto"),
  completeComplaint
);

router.get("/workers", authMiddleware, adminMiddleware, getWorkers);

module.exports = router;
