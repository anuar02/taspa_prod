import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import { HydratedDocument } from "mongoose";

import { IUser, UserModel } from "../models/User.model.js";
import { env } from "../config/env.js";
import { sendError } from "../utils/http.js";
import { sendResetCode } from "../utils/email.js";
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

export async function forgotPassword(request: Request, response: Response) {
  const { email } = request.body;

  if (!email) {
    return sendError(response, 400, "Email is required");
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Always 200 to avoid leaking which emails exist
    if (env.nodeEnv !== "production") {
      return response.json({ message: "ok", devAccountFound: false });
    }

    return response.json({ message: "ok" });
  }

  const code = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit code
  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  user.resetPasswordToken = hashedCode;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save();

  if (env.nodeEnv !== "production" && (!env.smtpUser || !env.smtpPass)) {
    console.info(`Password reset code for ${user.email}: ${code}`);
    return response.json({ message: "ok", devResetCode: code });
  }

  try {
    await sendResetCode(user.email, code);
  } catch (error) {
    if (env.nodeEnv !== "production") {
      // Keep the token so devResetCode can still be verified
      console.error("[forgot-password] SMTP error:", (error as Error).message);
      console.info(`[forgot-password] Dev code for ${user.email}: ${code}`);
      return response.json({ message: "ok", devResetCode: code });
    }

    user.resetPasswordToken = "";
    user.resetPasswordExpires = undefined;
    await user.save();
    return sendError(response, 500, "Failed to send email. Please try again later.");
  }

  if (env.nodeEnv !== "production") {
    console.info(`[forgot-password] Email sent to ${user.email}, code: ${code}`);
  }

  return response.json({ message: "ok" });
}

export async function verifyResetCode(request: Request, response: Response) {
  const { email, code } = request.body;

  if (!email || !code) {
    return sendError(response, 400, "Email and code are required");
  }

  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  const user = await UserModel.findOne({
    email: email.toLowerCase(),
    resetPasswordToken: hashedCode,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    return sendError(response, 400, "Code is invalid or has expired");
  }

  // Replace the OTP hash with a new reset token for the password step
  const rawResetToken = crypto.randomBytes(32).toString("hex");
  const hashedResetToken = crypto.createHash("sha256").update(rawResetToken).digest("hex");

  user.resetPasswordToken = hashedResetToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  return response.json({ resetToken: rawResetToken });
}

export async function resetPassword(request: Request, response: Response) {
  const { token, password } = request.body;

  if (!token || !password) {
    return sendError(response, 400, "Token and password are required");
  }

  if (password.length < 8) {
    return sendError(response, 400, "Password must be at least 8 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await UserModel.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    return sendError(response, 400, "Reset link is invalid or has expired");
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = "";
  user.resetPasswordExpires = undefined;
  user.refreshToken = "";
  await user.save();

  return response.json({ message: "Password has been reset successfully" });
}
