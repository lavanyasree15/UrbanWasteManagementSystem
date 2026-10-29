const Complaint = require("../models/Complaint");


const createComplaint = async (req, res) => {
  try {
    const { category, description } = req.body;
    let location = req.body.location;

    if (typeof location === "string") {
      try {
        location = JSON.parse(location);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid location data."
        });
      }
    }

    if (!category || !description || !location?.address) {
      return res.status(400).json({
        success: false,
        message: "Category, description and address are required."
      });
    }

    let photo = "";

    if (req.file) {
      if (!req.uploadToCloudinary) {
        throw new Error("Cloudinary upload helper is missing.");
      }

      photo = await req.uploadToCloudinary(req.file);
    }

    const complaint = await Complaint.create({
      citizen: req.user.id,
      category,
      description,
      location: {
        address: location.address,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null
      },
      photo
    });

    return res.status(201).json({
      success: true,
      message: "Complaint registered successfully.",
      complaint
    });
  } catch (error) {
    console.error("Create complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register complaint."
    });
  }
};



// Get complaints submitted by the logged-in citizen
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      citizen: req.user.id
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error("Get complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints."
    });
  }
};


const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Assigned",
      "In Progress",
      "Resolved",
      "Rejected"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint status."
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint status updated successfully.",
      complaint
    });
  } catch (error) {
    console.error("Update complaint status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update complaint status."
    });
  }
};


const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("citizen", "name email")
      .populate("assignedWorker", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error("Get all complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch all complaints."
    });
  }
};


const assignWorker = async (req, res) => {
  try {
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: "Worker ID is required."
      });
    }

    const User = require("../models/User");
    const worker = await User.findOne({
      _id: workerId,
      role: "worker"
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found."
      });
    }

    const complaint = await Complaint.findById(
      req.params.id
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found."
      });
    }

    complaint.assignedWorker = worker._id;
    complaint.status = "Assigned";

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: "Worker assigned successfully.",
      complaint
    });
  } catch (error) {
    console.error("Assign worker error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign worker."
    });
  }
};



const getAssignedComplaints = async (req, res) => {
  try {
    console.log("Logged-in user:", req.user);
    const complaints = await Complaint.find({
      assignedWorker: req.user.id
    })
      .populate("citizen", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error("Get assigned complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch assigned complaints.",
      error: error.message
    });
  }
};

const updateWorkerComplaintStatus = async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Only workers can update their assigned complaints."
      });
    }

    const { status } = req.body;

    if (status !== "In Progress") {
      return res.status(400).json({
        success: false,
        message: "Workers can only mark complaints as In Progress. Upload a completion photo to resolve."
      });
    }

    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedWorker: req.user.id
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Assigned complaint not found."
      });
    }
    console.log("Current complaint status:", complaint.status);
    if (complaint.status !== "Assigned" &&
        complaint.status !== "In Progress") {
      return res.status(400).json({
        success: false,
        message: "This complaint cannot be updated."
      });
    }

    complaint.status = "In Progress";
    await complaint.save();

    return res.status(200).json({
      success: true,
      message: "Complaint marked as In Progress.",
      complaint
    });
  } catch (error) {
    console.error("Worker status update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update complaint status."
    });
  }
};

const getWorkers = async (req, res) => {
  try {
    const User = require("../models/User");

    const workers = await User.find({ role: "worker" })
      .select("_id name email")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      workers
    });
  } catch (error) {
    console.error("Get workers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch workers."
    });
  }
};


const completeComplaint = async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Only workers can complete complaints."
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found."
      });
    }

    if (
      !complaint.assignedWorker ||
      complaint.assignedWorker.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this complaint."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a completion photo."
      });
    }

    if (complaint.status === "Resolved") {
      return res.status(400).json({
        success: false,
        message: "This complaint is already resolved."
      });
    }

    if (!req.uploadToCloudinary) {
      throw new Error("Cloudinary upload helper is missing.");
    }

    const completionPhoto =
      await req.uploadToCloudinary(req.file);

    complaint.completionPhoto = completionPhoto;
    complaint.status = "Resolved";
    complaint.resolvedAt = new Date();
    complaint.acknowledgement =
      "Your complaint has been resolved. The cleaning completion photo is available for verification.";

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: "Complaint resolved successfully. Citizen acknowledgement recorded.",
      complaint
    });
  } catch (error) {
    console.error("Complete complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete complaint."
    });
  }
};


module.exports = {
  createComplaint,
  getMyComplaints,
  updateComplaintStatus,
  getAllComplaints,
  assignWorker,
  getAssignedComplaints,
  getWorkers,
  completeComplaint,
  updateWorkerComplaintStatus
};