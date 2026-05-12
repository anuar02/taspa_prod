import { HydratedDocument, Schema, Types, model } from "mongoose";

export interface ICollection {
  owner: Types.ObjectId;
  title: string;
  description: string;
  photos: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 240 },
    photos: [{ type: Schema.Types.ObjectId, ref: "Photo", default: [] }]
  },
  { timestamps: true }
);

collectionSchema.index({ owner: 1, updatedAt: -1 });

export type CollectionDocument = HydratedDocument<ICollection>;
export const CollectionModel = model<ICollection>("Collection", collectionSchema);
