const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  register,
  login,
  logout,
  createWorker
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

// Only logged-in admins can create workers
router.post(
  "/workers",
  authMiddleware,
  adminMiddleware,
  createWorker
);

module.exports = router;