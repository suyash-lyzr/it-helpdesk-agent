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
  metadata?: Record<string, unknown>;
  // ServiceNow credentials (encrypted)
  clientId?: string;
  encryptedClientSecret?: string;
  grantType?: "authorization_code" | "client_credentials";
  redirectUri?: string;
  savedAt?: Date;
  oauthState?: string; // For CSRF protection
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
    // ServiceNow credentials
    clientId: { type: String },
    encryptedClientSecret: { type: String },
    grantType: {
      type: String,
      enum: ["authorization_code", "client_credentials"],
    },
    redirectUri: { type: String },
    savedAt: { type: Date },
    oauthState: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const IntegrationOAuthModel =
  models.IntegrationOAuth ||
  model<IntegrationOAuth>("IntegrationOAuth", IntegrationOAuthSchema);
