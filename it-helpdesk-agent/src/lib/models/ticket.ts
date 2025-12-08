import { Schema, model, models } from "mongoose";
import { Ticket } from "../ticket-types";

const TicketSchema = new Schema<Ticket>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ticket_type: {
      type: String,
      enum: ["incident", "access_request", "request"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    user_name: { type: String, required: true },
    app_or_system: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    collected_details: { type: Schema.Types.Mixed, default: {} },
    suggested_team: {
      type: String,
      enum: [
        "Network",
        "Endpoint Support",
        "Application Support",
        "IAM",
        "Security",
        "DevOps",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    created_at: { type: Date, required: true, index: true },
    updated_at: { type: Date, required: true },
    first_response_at: { type: Date },
    resolved_at: { type: Date },
    sla_due_at: { type: Date },
    sla_breached_at: { type: Date },
    asset_id: { type: String },
    external_ids: { type: Map, of: String },
    source: { type: String, enum: ["chat", "email", "integration", "manual"] },
    assignee: { type: String },
    lifecycle_stage: {
      type: String,
      enum: [
        "new",
        "triage",
        "in_progress",
        "waiting_for_user",
        "resolved",
        "closed",
      ],
    },
    reopened_count: { type: Number, default: 0 },
    csat_score: { type: Number, min: 0, max: 1 }, // 0 = thumbs down, 1 = thumbs up
    csat_comment: { type: String },
    csat_submitted_at: { type: Date },
  },
  { versionKey: false }
);

TicketSchema.index({
  title: "text",
  description: "text",
  user_name: "text",
  app_or_system: "text",
});

export const TicketModel =
  models.Ticket || model<Ticket>("Ticket", TicketSchema);
