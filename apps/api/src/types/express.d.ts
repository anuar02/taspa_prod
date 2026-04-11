import { IUser } from "../models/User.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export type SafeUser = Omit<IUser, "password" | "refreshToken">;
