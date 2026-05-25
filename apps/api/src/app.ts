import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { aiRouter } from "./routes/ai.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { collectionRouter } from "./routes/collection.routes.js";
import { commentRouter } from "./routes/comment.routes.js";
import { photoRouter } from "./routes/photo.routes.js";
import { reportRouter } from "./routes/report.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { userRouter } from "./routes/user.routes.js";

export const app = express();

const allowedOrigins = env.clientUrl
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string) {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (env.nodeEnv !== "production") {
    return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  }

  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api", (_request, response) => {
  response.json({
    ok: true,
    service: "taspa-api"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);
app.use("/api/admin", adminRouter);
app.use("/api/collections", collectionRouter);
app.use("/api/photos", photoRouter);
app.use("/api/comments", commentRouter);
app.use("/api/reports", reportRouter);
app.use("/api/users", userRouter);
app.use("/api/search", searchRouter);
