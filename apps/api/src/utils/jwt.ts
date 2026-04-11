import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

type JwtPayload = {
  userId: string;
};

export function signAccessToken(userId: string) {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"]
  });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiresIn as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.refreshTokenSecret) as JwtPayload;
}
