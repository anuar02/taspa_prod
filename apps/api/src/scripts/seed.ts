import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";
import { PhotoModel } from "../models/Photo.model.js";
import { UserModel } from "../models/User.model.js";

const demoUsers = [
  {
    username: "sanarys",
    email: "sanarys@example.com",
    displayName: "Сан Арыс",
    bio: "Табиғат пен жарық сәттерін түсіремін."
  },
  {
    username: "aigerim",
    email: "aigerim@example.com",
    displayName: "Айгерім",
    bio: "Қала, көше және тыныш кадрлар."
  }
];

const demoPhotos = [
  {
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
    caption: "Таңғы жарық пен тыныш дала.",
    tags: ["#табиғат", "#таң"],
    category: "NATURE",
    location: "Алматы"
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=80",
    caption: "Қаланың кешкі ырғағы.",
    tags: ["#қала", "#кеш"],
    category: "CITY",
    location: "Астана"
  }
];

async function run() {
  await connectDatabase();

  await Promise.all([
    UserModel.deleteMany({ email: { $in: demoUsers.map((user) => user.email) } }),
    PhotoModel.deleteMany({ caption: { $in: demoPhotos.map((photo) => photo.caption) } })
  ]);

  const password = await bcrypt.hash("password123", 10);
  const users = await UserModel.create(
    demoUsers.map((user) => ({
      ...user,
      password
    }))
  );

  await PhotoModel.create(
    demoPhotos.map((photo, index) => ({
      ...photo,
      author: users[index % users.length]._id,
      likesCount: index === 0 ? 24 : 8,
      isPopular: index === 0
    }))
  );

  await Promise.all(
    users.map((user, index) =>
      UserModel.findByIdAndUpdate(user._id, {
        postsCount: demoPhotos.filter((_photo, photoIndex) => photoIndex % users.length === index).length
      })
    )
  );

  console.log("Seed complete.");
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Seed failed", error);
  await mongoose.disconnect();
  process.exit(1);
});
