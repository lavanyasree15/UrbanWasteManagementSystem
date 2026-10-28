
const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    category: {
      type: String,
      enum: [
        "Household Waste",
        "Plastic Waste",
        "Industrial Waste",
        "E-Waste",
        "Construction Waste",
        "Other"
      ],
      required: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      address: {
        type: String,
        required: true
      },
      latitude: Number,
      longitude: Number
    },

    photo: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Assigned",
        "In Progress",
        "Resolved",
        "Rejected"
      ],
      default: "Pending"
    },

    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    completionPhoto: {
  type: String,
  default: ""
},

resolvedAt: {
  type: Date,
  default: null
},

acknowledgement: {
  type: String,
  default: ""
}

  },
  { timestamps: true }
);



module.exports = mongoose.model("Complaint", complaintSchema);
