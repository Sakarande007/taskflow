import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/connectDB.js";

async function fix() {
  await connectDB();
  const db = mongoose.connection.db;
  const collection = db.collection("users");

  console.log("🔍 Checking indexes...");
  const indexes = await collection.indexes();
  const hasEmployeeIndex = indexes.find(i => i.name === "employeeId_1");

  if (hasEmployeeIndex) {
    console.log("🗑️  Dropping problematic employeeId_1 index...");
    await collection.dropIndex("employeeId_1");
    console.log("✅ Index dropped successfully.");
  } else {
    console.log("ℹ️  employeeId_1 index not found. Nothing to drop.");
  }

  console.log("🧹 Cleaning up null employeeId residues...");
  // We don't delete the users, just unset the employeeId field if it's null
  // so that the new sparse index can be created correctly by Mongoose on next start.
  const result = await collection.updateMany(
    { employeeId: null },
    { $unset: { employeeId: "" } }
  );

  console.log(`✅ Updated ${result.modifiedCount} documents.`);
  console.log("\n🚀 All done! Please restart your server now.");
  console.log("Mongoose will automatically recreate the index as 'sparse' on the next start.");
  process.exit(0);
}

fix().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
