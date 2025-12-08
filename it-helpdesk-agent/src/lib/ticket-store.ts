// In-memory ticket store for managing tickets
// Can be replaced with a database in production

import { FilterQuery, LeanDocument } from "mongoose";
import { connectToDatabase } from "./db";
import { TicketModel } from "./models/ticket";
import {
  Ticket,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketQueryParams,
  generateTicketId,
} from "./ticket-types";

const DEFAULT_LIMIT = 50;

type TicketDoc = LeanDocument<
  Ticket & {
    external_ids?: Map<string, string> | Record<string, string>;
    created_at: Date | string;
    updated_at: Date | string;
    first_response_at?: Date | string;
    resolved_at?: Date | string;
    sla_due_at?: Date | string;
    sla_breached_at?: Date | string;
    csat_submitted_at?: Date | string;
  }
>;

const toISO = (value?: Date | string) => {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
};

const mapTicket = (doc: TicketDoc): Ticket => {
  const externalIds =
    doc.external_ids instanceof Map
      ? Object.fromEntries(doc.external_ids)
      : doc.external_ids
      ? { ...doc.external_ids }
      : undefined;

  return {
    id: doc.id,
    ticket_type: doc.ticket_type,
    title: doc.title,
    description: doc.description,
    user_name: doc.user_name,
    app_or_system: doc.app_or_system,
    priority: doc.priority,
    collected_details: doc.collected_details || {},
    suggested_team: doc.suggested_team,
    status: doc.status,
    created_at: toISO(doc.created_at)!,
    updated_at: toISO(doc.updated_at)!,
    sla_due_at: toISO(doc.sla_due_at),
    sla_breached_at: toISO(doc.sla_breached_at),
    asset_id: doc.asset_id,
    external_ids: externalIds,
    source: doc.source,
    assignee: doc.assignee,
    first_response_at: toISO(doc.first_response_at),
    resolved_at: toISO(doc.resolved_at),
    lifecycle_stage: doc.lifecycle_stage,
    reopened_count: doc.reopened_count,
    csat_score: doc.csat_score,
    csat_comment: doc.csat_comment,
    csat_submitted_at: toISO(doc.csat_submitted_at),
  };
};

export async function createTicket(data: CreateTicketRequest): Promise<Ticket> {
  await connectToDatabase();
  const now = new Date();

  const slaHours =
    data.priority === "high" ? 24 : data.priority === "medium" ? 48 : 72;
  const slaDueAt = new Date(now);
  slaDueAt.setHours(slaDueAt.getHours() + slaHours);

  const doc = await TicketModel.create({
    id: generateTicketId(),
    ticket_type: data.ticket_type,
    title: data.title,
    description: data.description,
    user_name: data.user_name || "unknown",
    app_or_system: data.app_or_system || "general",
    priority: data.priority || "medium",
    collected_details: data.collected_details || {},
    suggested_team: data.suggested_team || "Application Support",
    status: data.status || "open",
    created_at: now,
    updated_at: now,
    sla_due_at: slaDueAt,
    source: data.source || "chat",
    assignee: data.assignee,
    asset_id: data.asset_id,
    external_ids: data.external_ids,
    lifecycle_stage: "new",
  });

  return mapTicket(doc.toObject() as TicketDoc);
}

export async function getTickets(
  params?: TicketQueryParams
): Promise<{ tickets: Ticket[]; total: number }> {
  await connectToDatabase();

  const filter: FilterQuery<Ticket> = {};

  if (params?.status) filter.status = params.status;
  if (params?.priority) filter.priority = params.priority;
  if (params?.ticket_type) filter.ticket_type = params.ticket_type;
  if (params?.suggested_team) filter.suggested_team = params.suggested_team;

  const offset = params?.offset || 0;
  const limit = params?.limit || DEFAULT_LIMIT;

  const [total, docs] = await Promise.all([
    TicketModel.countDocuments(filter),
    TicketModel.find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .lean<TicketDoc>(),
  ]);

  return {
    tickets: docs.map(mapTicket),
    total,
  };
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  await connectToDatabase();
  const doc = await TicketModel.findOne({ id }).lean<TicketDoc>();
  return doc ? mapTicket(doc) : null;
}

export async function updateTicket(
  id: string,
  data: UpdateTicketRequest
): Promise<Ticket | null> {
  await connectToDatabase();

  const update = {
    ...data,
    updated_at: new Date(),
  };

  const doc = (await TicketModel.findOneAndUpdate({ id }, update, {
    new: true,
    lean: true,
  })) as TicketDoc | null;

  return doc ? mapTicket(doc) : null;
}

export async function deleteTicket(id: string): Promise<boolean> {
  await connectToDatabase();
  const result = await TicketModel.deleteOne({ id });
  return result.deletedCount === 1;
}

export async function getTicketCounts(): Promise<{
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}> {
  await connectToDatabase();

  const [total, open, inProgress, resolved, closed] = await Promise.all([
    TicketModel.estimatedDocumentCount(),
    TicketModel.countDocuments({ status: "open" }),
    TicketModel.countDocuments({ status: "in_progress" }),
    TicketModel.countDocuments({ status: "resolved" }),
    TicketModel.countDocuments({ status: "closed" }),
  ]);

  return {
    total,
    open,
    in_progress: inProgress,
    resolved,
    closed,
  };
}

export async function searchTickets(query: string): Promise<Ticket[]> {
  await connectToDatabase();
  const regex = new RegExp(query, "i");

  const docs = await TicketModel.find({
    $or: [
      { title: regex },
      { description: regex },
      { user_name: regex },
      { app_or_system: regex },
    ],
  })
    .sort({ created_at: -1 })
    .lean<TicketDoc>();

  return docs.map(mapTicket);
}
