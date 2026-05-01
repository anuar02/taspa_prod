import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(currentDir, "../../.env") });
dotenv.config({ path: resolve(currentDir, "../../../.env") });

function cleanEnv(value?: string) {
  return (value ?? "").trim();
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: cleanEnv(process.env.NODE_ENV) || "development",
  mongodbUri: cleanEnv(process.env.MONGODB_URI),
  jwtSecret: cleanEnv(process.env.JWT_SECRET) || "replace-me",
  jwtExpiresIn: cleanEnv(process.env.JWT_EXPIRES_IN) || "15m",
  refreshTokenSecret: cleanEnv(process.env.REFRESH_TOKEN_SECRET) || "replace-me-refresh",
  refreshTokenExpiresIn: cleanEnv(process.env.REFRESH_TOKEN_EXPIRES_IN) || "7d",
  cloudinaryCloudName: cleanEnv(process.env.CLOUDINARY_CLOUD_NAME),
  cloudinaryApiKey: cleanEnv(process.env.CLOUDINARY_API_KEY),
  cloudinaryApiSecret: cleanEnv(process.env.CLOUDINARY_API_SECRET),
  clientUrl: cleanEnv(process.env.CLIENT_URL) || "http://localhost:3000",
  pexelsApiKey: cleanEnv(process.env.PEXELS_API_KEY),
  smtpHost: cleanEnv(process.env.SMTP_HOST) || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: cleanEnv(process.env.SMTP_USER),
  smtpPass: cleanEnv(process.env.SMTP_PASS),
  smtpFrom: cleanEnv(process.env.SMTP_FROM)
};
