import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { commentRouter } from "./routes/comment.routes.js";
import { photoRouter } from "./routes/photo.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { userRouter } from "./routes/user.routes.js";

export const app = express();

const allowedOrigins = env.clientUrl
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
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
app.use("/api/photos", photoRouter);
app.use("/api/comments", commentRouter);
app.use("/api/users", userRouter);
app.use("/api/search", searchRouter);
