
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["citizen", "admin", "worker"],
      default: "citizen"
    },

    // Additional worker details
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    address: {
      type: String,
      trim: true,
      default: ""
    },
    workerId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true
    },
    vehicleType: {
      type: String,
      enum: ["", "Bicycle", "Two Wheeler", "Auto", "Truck", "Other"],
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
