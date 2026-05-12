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
  },
  {
    username: "nurai",
    email: "nurai@example.com",
    displayName: "Нұрай",
    bio: "Портрет пен жұмсақ түстерді жақсы көремін."
  },
  {
    username: "askar",
    email: "askar@example.com",
    displayName: "Асқар",
    bio: "Архитектура, көше және сапар кадрлары."
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
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
    caption: "Жұмсақ портрет, тыныш көңіл-күй.",
    tags: ["#портрет", "#жарық"],
    category: "PORTRAIT",
    location: "Шымкент"
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=600&q=80",
    caption: "Таудың етегіндегі таза ауа.",
    tags: ["#тау", "#табиғат"],
    category: "NATURE",
    location: "Медеу"
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80",
    caption: "Өнер мен текстура қатар өмір сүретін сәт.",
    tags: ["#өнер", "#минимал"],
    category: "ART",
    location: "Қарағанды"
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    caption: "Түскі ас алдындағы жылы түстер.",
    tags: ["#food", "#дәм"],
    category: "FOOD",
    location: "Алматы"
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80",
    caption: "Қаланы жоғарыдан көру әрдайым басқа сезім береді.",
    tags: ["#city", "#urban"],
    category: "CITY",
    location: "Астана"
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    caption: "Тік қараған портреттің күші.",
    tags: ["#адам", "#портрет"],
    category: "PORTRAIT",
    location: "Тараз"
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=80",
    caption: "Көл бетіне түскен аспанның айнасы.",
    tags: ["#көл", "#reflection"],
    category: "NATURE",
    location: "Бурабай"
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
    demoUsers.map((user, index) => ({
      ...user,
      password,
      role: index === 0 ? "ADMIN" : "USER"
    }))
  );

  await PhotoModel.create(
    demoPhotos.map((photo, index) => ({
      ...photo,
      author: users[index % users.length]._id,
      likesCount: [24, 18, 12, 27, 9, 21, 15, 30][index] ?? 8,
      commentsCount: [4, 1, 3, 5, 1, 2, 2, 6][index] ?? 0,
      views: [180, 95, 120, 240, 88, 210, 130, 260][index] ?? 50,
      isPopular: ([24, 18, 12, 27, 9, 21, 15, 30][index] ?? 0) >= 20
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
