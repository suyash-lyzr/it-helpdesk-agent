import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser {
  lyzrUserId: string;
  email: string;
  displayName: string;
  lyzrApiKey: string;
  schemaVersion: number;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

const UserSchema: Schema<IUserDocument> = new Schema<IUserDocument>(
  {
    lyzrUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    lyzrApiKey: { type: String, required: true },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUserDocument>("User", UserSchema);
