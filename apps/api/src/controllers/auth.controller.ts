import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { HydratedDocument } from "mongoose";

import { IUser, UserModel } from "../models/User.model.js";
import { sendError } from "../utils/http.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

function sanitizeUser(user: HydratedDocument<IUser> | null) {
  if (!user) {
    return null;
  }

  const object = user.toObject();
  const { password, refreshToken, ...safeUser } = object;
  return safeUser;
}

export async function register(request: Request, response: Response) {
  const { username, email, password, displayName } = request.body;

  if (!username || !email || !password || !displayName) {
    return sendError(response, 400, "All fields are required");
  }

  if (password.length < 8) {
    return sendError(response, 400, "Password must be at least 8 characters");
  }

  const existingUser = await UserModel.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
  });

  if (existingUser) {
    return sendError(response, 409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hashedPassword,
    displayName
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  user.refreshToken = refreshToken;
  await user.save();

  return response.status(201).json({
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  });
}

export async function login(request: Request, response: Response) {
  const { email, password } = request.body;

  const user = await UserModel.findOne({ email: email?.toLowerCase() });

  if (!user) {
    return sendError(response, 401, "Invalid email or password");
  }

  const isValid = await bcrypt.compare(password ?? "", user.password);

  if (!isValid) {
    return sendError(response, 401, "Invalid email or password");
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  user.refreshToken = refreshToken;
  await user.save();

  return response.json({
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  });
}

export async function refresh(request: Request, response: Response) {
  const { refreshToken } = request.body;

  if (!refreshToken) {
    return sendError(response, 400, "Refresh token is required");
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(payload.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return sendError(response, 401, "Invalid refresh token");
    }

    const nextAccessToken = signAccessToken(user.id);
    const nextRefreshToken = signRefreshToken(user.id);

    user.refreshToken = nextRefreshToken;
    await user.save();

    return response.json({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken
    });
  } catch {
    return sendError(response, 401, "Invalid refresh token");
  }
}

export async function logout(request: Request, response: Response) {
  const { refreshToken } = request.body;

  if (!refreshToken) {
    return response.status(204).send();
  }

  await UserModel.findOneAndUpdate({ refreshToken }, { refreshToken: "" });
  return response.status(204).send();
}

export async function me(request: Request, response: Response) {
  const user = await UserModel.findById(request.user?.id);
  return response.json({ user: sanitizeUser(user) });
}
