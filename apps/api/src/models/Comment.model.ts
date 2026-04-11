import { Schema, Types, model } from "mongoose";

export interface IComment {
  photo: Types.ObjectId;
  author: Types.ObjectId;
  text: string;
  likes: Types.ObjectId[];
  parentComment?: Types.ObjectId | null;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    photo: { type: Schema.Types.ObjectId, ref: "Photo", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CommentModel = model<IComment>("Comment", commentSchema);
