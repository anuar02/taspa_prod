import { HydratedDocument, Schema, Types, model } from "mongoose";

export type ReportStatus = "OPEN" | "REVIEWED" | "DISMISSED";

export interface IReport {
  photo: Types.ObjectId;
  reporter: Types.ObjectId;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    photo: { type: Schema.Types.ObjectId, ref: "Photo", required: true, index: true },
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ["OPEN", "REVIEWED", "DISMISSED"], default: "OPEN", index: true }
  },
  { timestamps: true }
);

reportSchema.index({ photo: 1, reporter: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

export type ReportDocument = HydratedDocument<IReport>;
export const ReportModel = model<IReport>("Report", reportSchema);
