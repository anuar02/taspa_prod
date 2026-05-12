import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export interface IUser {
  username: string;
  email: string;
  password: string;
  role: "USER" | "ADMIN";
  displayName: string;
  bio: string;
  avatarUrl: string;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  postsCount: number;
  followersCount: number;
  followingCount: number;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type UserModel = Model<IUser>;

const userSchema = new Schema<IUser, UserModel>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER", index: true },
    displayName: { type: String, required: true, trim: true },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    followers: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    following: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    postsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    refreshToken: { type: String, default: "" },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);

export type UserDocument = HydratedDocument<IUser>;
export const UserModel = model<IUser, UserModel>("User", userSchema);
