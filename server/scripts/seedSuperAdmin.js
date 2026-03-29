import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import UserModel from "../models/user.model.js";
import connectDB from "../config/connectDB.js";

await connectDB();

const existing = await UserModel.findOne({ role: "superadmin" });
if (existing) {
  console.log("✅ SuperAdmin already exists:", existing.email);
  process.exit(0);
}

const salt     = await bcryptjs.genSalt(10);
const password = await bcryptjs.hash("SuperAdmin@123", salt);

const sa = await new UserModel({
  name:         "Super Admin",
  email:        "superadmin@taskflow.com",
  password,
  role:         "superadmin",
  verify_email: true,
  status:       "Active",
  isActive:     true,
}).save();

console.log("✅ SuperAdmin created!");
console.log("   Email   :", sa.email);
console.log("   Password: SuperAdmin@123");
console.log("   ⚠️  Change this password after first login!");
process.exit(0);
