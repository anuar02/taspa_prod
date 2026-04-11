import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "replace-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET ?? "replace-me-refresh",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  pexelsApiKey: process.env.PEXELS_API_KEY ?? ""
};
