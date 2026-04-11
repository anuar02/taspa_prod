import { Schema, Types, model } from "mongoose";

export interface INotification {
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  type: "LIKE" | "COMMENT" | "FOLLOW" | "SAVE";
  photo?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["LIKE", "COMMENT", "FOLLOW", "SAVE"], required: true },
    photo: { type: Schema.Types.ObjectId, ref: "Photo" },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const NotificationModel = model<INotification>("Notification", notificationSchema);
