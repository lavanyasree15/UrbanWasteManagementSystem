
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const complaintRoutes = require("./routes/complaintRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
const authRoutes = require("./routes/authRoutes");
app.use("/api/complaints", complaintRoutes);

app.use("/api/auth", authRoutes);
app.get("/", (req, res) => {
  res.send("Urban Waste Management Backend is Running!");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Urban Waste Management API is running!"
  });
});

module.exports = app;
