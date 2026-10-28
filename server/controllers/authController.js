
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const crypto = require("crypto");

// REGISTER CITIZEN
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "citizen"
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered."
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register user."
    });
  }
};

// LOGIN USER AND CREATE SESSION
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from .env");

      return res.status(500).json({
        success: false,
        message: "Server configuration error."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const sessionId = crypto.randomUUID();

    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        sid: sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await Session.create({
      user: user._id,
      tokenHash,
      expiresAt
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to login."
    });
  }
};

// LOGOUT USER AND REVOKE CURRENT SESSION
const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token required."
      });
    }

    const token = authHeader.slice(7);

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const result = await Session.updateOne(
      {
        user: req.user.id,
        tokenHash,
        revokedAt: null
      },
      {
        $set: {
          revokedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Active session not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully."
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log out."
    });
  }
};

// ADMIN CREATES A WORKER

const createWorker = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      address,
      workerId,
      vehicleType
    } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters."
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match."
      });
    }

    if (phone && !/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit phone number."
      });
    }

    const allowedVehicles = [
      "Bicycle",
      "Two Wheeler",
      "Auto",
      "Truck",
      "Other"
    ];

    if (
      vehicleType &&
      !allowedVehicles.includes(vehicleType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid vehicle type."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered."
      });
    }

    const normalizedWorkerId = workerId?.trim();

    if (normalizedWorkerId) {
      const existingWorker = await User.findOne({
        workerId: normalizedWorkerId
      });

      if (existingWorker) {
        return res.status(409).json({
          success: false,
          message: "Worker ID is already registered."
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const worker = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "worker",
      phone: phone?.trim() || "",
      address: address?.trim() || "",
      workerId: normalizedWorkerId || undefined,
      vehicleType: vehicleType || ""
    });

    return res.status(201).json({
      success: true,
      message: "Worker created successfully.",
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        address: worker.address,
        workerId: worker.workerId,
        vehicleType: worker.vehicleType,
        role: worker.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or Worker ID is already registered."
      });
    }

    console.error("Create worker error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create worker."
    });
  }
};


module.exports = {
  register,
  login,
  logout,
  createWorker
};
