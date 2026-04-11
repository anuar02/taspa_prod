import { v2 as cloudinary } from "cloudinary";

import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret
});

export async function uploadImage(buffer: Buffer, folder: string) {
  const dataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  const uploadResult = await cloudinary.uploader.upload(dataUri, { folder });
  const publicId = uploadResult.public_id;

  return {
    imageUrl: cloudinary.url(publicId, { quality: "auto", fetch_format: "auto" }),
    thumbnailUrl: cloudinary.url(publicId, {
      width: 400,
      height: 400,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto"
    })
  };
}

export function buildAvatar(publicId: string) {
  return cloudinary.url(publicId, {
    width: 150,
    height: 150,
    crop: "fill",
    radius: "max"
  });
}
