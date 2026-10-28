
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password || password.length < 8) {
      throw new Error(
        "Set ADMIN_NAME, ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters in .env"
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role === "admin") {
        console.log("This admin account already exists.");
      } else {
        console.log(
          "This email already belongs to a non-admin account. No changes made."
        );
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin"
    });

    console.log("Admin account created successfully.");
    console.log("Email:", email);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
