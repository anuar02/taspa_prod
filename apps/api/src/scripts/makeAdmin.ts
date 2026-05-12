import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";
import { UserModel } from "../models/User.model.js";

async function run() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error("Usage: npm run make:admin --workspace=apps/api -- user@example.com");
  }

  await connectDatabase();

  const user = await UserModel.findOneAndUpdate(
    { email },
    { role: "ADMIN" },
    { new: true }
  ).select("email username role");

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  console.log(`${user.email} (${user.username}) is now ${user.role}.`);
}

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
