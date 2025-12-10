import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFeatureRequest {
  email: string;
  request: string;
  status: "pending" | "reviewed" | "implemented" | "rejected";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFeatureRequestDocument extends IFeatureRequest, Document {
  _id: Types.ObjectId;
}

const FeatureRequestSchema: Schema<IFeatureRequestDocument> =
  new Schema<IFeatureRequestDocument>(
    {
      email: { type: String, required: true },
      request: { type: String, required: true },
      status: {
        type: String,
        default: "pending",
        enum: ["pending", "reviewed", "implemented", "rejected"],
      },
    },
    { timestamps: true }
  );

if (mongoose.models.FeatureRequest) {
  delete mongoose.models.FeatureRequest;
}

export default mongoose.model<IFeatureRequestDocument>(
  "FeatureRequest",
  FeatureRequestSchema
);
