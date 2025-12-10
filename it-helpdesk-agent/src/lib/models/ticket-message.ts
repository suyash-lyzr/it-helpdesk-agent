import { Schema, model, models } from "mongoose";
import { TicketMessage } from "../ticket-message-types";

const TicketMessageSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    ticket_id: { type: String, required: true, index: true },
    author_type: {
      type: String,
      enum: ["user", "agent", "system", "ai"],
      required: true,
    },
    author_name: { type: String },
    body: { type: String, required: true },
    is_internal_note: { type: Boolean, default: false },
    created_at: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true,
    },
  },
  { versionKey: false }
);

// Compound index for efficient ticket conversation queries
TicketMessageSchema.index({ ticket_id: 1, created_at: 1 });

export const TicketMessageModel =
  models.TicketMessage ||
  model<TicketMessage>("TicketMessage", TicketMessageSchema);
