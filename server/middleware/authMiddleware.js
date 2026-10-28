
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Session = require("../models/Session");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Token required."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.sid || !decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Invalid session token."
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const session = await Session.findOne({
      user: decoded.id,
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired or revoked. Please log in again."
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      sessionId: decoded.sid
    };

    next();
  } catch (error) {
    if (error.name !== "JsonWebTokenError" &&
        error.name !== "TokenExpiredError") {
      console.error("Authentication error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Authentication service error."
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

module.exports = authMiddleware;
