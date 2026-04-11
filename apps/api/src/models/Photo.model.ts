import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export type PhotoCategory = "NATURE" | "PORTRAIT" | "CITY" | "ART" | "FOOD" | "OTHER";

export interface IPhoto {
  author: Types.ObjectId;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
  tags: string[];
  category: PhotoCategory;
  location: string;
  likes: Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  saves: Types.ObjectId[];
  views: number;
  isPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type PhotoModel = Model<IPhoto>;

const photoSchema = new Schema<IPhoto, PhotoModel>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    caption: { type: String, default: "" },
    tags: [{ type: String, default: [] }],
    category: {
      type: String,
      enum: ["NATURE", "PORTRAIT", "CITY", "ART", "FOOD", "OTHER"],
      default: "OTHER"
    },
    location: { type: String, default: "" },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    saves: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    views: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false }
  },
  { timestamps: true }
);

photoSchema.index({ tags: 1 });
photoSchema.index({ category: 1 });
photoSchema.index({ createdAt: -1 });

export type PhotoDocument = HydratedDocument<IPhoto>;
export const PhotoModel = model<IPhoto, PhotoModel>("Photo", photoSchema);
