import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserTools {
  version: string;
  toolIds: string[];
}

export interface IUserAgentInfo {
  agentId: string;
  version: string;
}

export interface IUser {
  lyzrUserId: string;
  email: string;
  displayName: string;
  lyzrApiKey: string;
  tools?: IUserTools;
  orchestratorAgent?: IUserAgentInfo;
  troubleshootingAgent?: IUserAgentInfo;
  ticketGeneratorAgent?: IUserAgentInfo;
  accessRequestAgent?: IUserAgentInfo;
  kbAgent?: IUserAgentInfo;
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
    tools: {
      version: { type: String },
      toolIds: { type: [String], default: [] },
    },
    orchestratorAgent: {
      agentId: { type: String },
      version: { type: String },
    },
    troubleshootingAgent: {
      agentId: { type: String },
      version: { type: String },
    },
    ticketGeneratorAgent: {
      agentId: { type: String },
      version: { type: String },
    },
    accessRequestAgent: {
      agentId: { type: String },
      version: { type: String },
    },
    kbAgent: {
      agentId: { type: String },
      version: { type: String },
    },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUserDocument>("User", UserSchema);
