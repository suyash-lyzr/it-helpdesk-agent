import { Schema, model, models } from "mongoose";

export interface IntegrationOAuth {
  provider: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  instanceUrl?: string;
  connected: boolean;
  connectedAt?: Date;
  lastTestAt?: Date;
  metadata?: Record<string, any>;
}

const IntegrationOAuthSchema = new Schema<IntegrationOAuth>(
  {
    provider: { type: String, required: true, unique: true, index: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiry: { type: Date },
    instanceUrl: { type: String },
    connected: { type: Boolean, default: false },
    connectedAt: { type: Date },
    lastTestAt: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const IntegrationOAuthModel =
  models.IntegrationOAuth ||
  model<IntegrationOAuth>("IntegrationOAuth", IntegrationOAuthSchema);
