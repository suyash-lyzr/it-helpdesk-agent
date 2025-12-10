// In-memory ticket store for managing tickets
// Can be replaced with a database in production

import mongoose from "mongoose";

// Type definitions for mongoose v9+
type FilterQuery<T> = Record<string, unknown> & Partial<T>;
type LeanDocument<T> = T;
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
    lyzrUserId?: string;
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
    lyzrUserId: doc.lyzrUserId,
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

  // Auto-assign access requests to the manager mentioned in collected_details
  let assignee = data.assignee;
  if (
    data.ticket_type === "access_request" &&
    !assignee &&
    data.collected_details?.manager_name
  ) {
    assignee = String(
      (data.collected_details as { manager_name?: string }).manager_name
    );
  }

  const doc = await TicketModel.create({
    lyzrUserId: data.lyzrUserId || "unknown",
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
    created_at: data.created_at ? new Date(data.created_at) : now,
    updated_at: now,
    sla_due_at: slaDueAt,
    source: data.source || "chat",
    assignee: assignee,
    asset_id: data.asset_id,
    external_ids: data.external_ids,
    lifecycle_stage: "new",
    // Accept timestamp fields from data for demo seeding
    first_response_at: data.first_response_at
      ? new Date(data.first_response_at)
      : undefined,
    resolved_at: data.resolved_at ? new Date(data.resolved_at) : undefined,
    csat_score: data.csat_score,
    csat_submitted_at: data.csat_score !== undefined ? now : undefined,
    lifecycle_stage: data.lifecycle_stage || "new",
    sla_breached_at: data.sla_breached_at
      ? new Date(data.sla_breached_at)
      : undefined,
  });

  return mapTicket(doc.toObject() as TicketDoc);
}

export async function getTickets(
  params?: TicketQueryParams
): Promise<{ tickets: Ticket[]; total: number }> {
  await connectToDatabase();

  const filter: FilterQuery<Ticket> = {};

  if (params?.lyzrUserId) filter.lyzrUserId = params.lyzrUserId;
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
      .lean(),
  ]);

  return {
    tickets: (docs as TicketDoc[]).map(mapTicket),
    total,
  };
}

export async function getTicketById(
  id: string,
  lyzrUserId?: string
): Promise<Ticket | null> {
  await connectToDatabase();

  const filter: FilterQuery<Ticket> & { lyzrUserId?: string } = { id };
  if (lyzrUserId) {
    filter.lyzrUserId = lyzrUserId;
  }

  const doc = await TicketModel.findOne(filter).lean();
  return doc ? mapTicket(doc as TicketDoc) : null;
}

export async function updateTicket(
  id: string,
  data: UpdateTicketRequest,
  lyzrUserId?: string
): Promise<Ticket | null> {
  await connectToDatabase();

  const update = {
    ...data,
    updated_at: new Date(),
  };

  const filter: FilterQuery<Ticket> & { lyzrUserId?: string } = { id };
  if (lyzrUserId) {
    filter.lyzrUserId = lyzrUserId;
  }

  const doc = (await TicketModel.findOneAndUpdate(filter, update, {
    new: true,
    lean: true,
  })) as TicketDoc | null;

  return doc ? mapTicket(doc) : null;
}

export async function deleteTicket(
  id: string,
  lyzrUserId?: string
): Promise<boolean> {
  await connectToDatabase();

  const filter: FilterQuery<Ticket> & { lyzrUserId?: string } = { id };
  if (lyzrUserId) {
    filter.lyzrUserId = lyzrUserId;
  }

  const result = await TicketModel.deleteOne(filter);
  return result.deletedCount === 1;
}

export async function getTicketCounts(lyzrUserId?: string): Promise<{
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}> {
  await connectToDatabase();

  const baseFilter: FilterQuery<Ticket> & { lyzrUserId?: string } = {};
  if (lyzrUserId) {
    baseFilter.lyzrUserId = lyzrUserId;
  }

  const [total, open, inProgress, resolved, closed] = await Promise.all([
    TicketModel.countDocuments(baseFilter),
    TicketModel.countDocuments({ ...baseFilter, status: "open" }),
    TicketModel.countDocuments({ ...baseFilter, status: "in_progress" }),
    TicketModel.countDocuments({ ...baseFilter, status: "resolved" }),
    TicketModel.countDocuments({ ...baseFilter, status: "closed" }),
  ]);

  return {
    total,
    open,
    in_progress: inProgress,
    resolved,
    closed,
  };
}

export async function searchTickets(
  query: string,
  lyzrUserId?: string
): Promise<Ticket[]> {
  await connectToDatabase();
  const regex = new RegExp(query, "i");

  const criteria: FilterQuery<Ticket> & { lyzrUserId?: string } = {
    $or: [
      { title: regex },
      { description: regex },
      { user_name: regex },
      { app_or_system: regex },
    ],
  };

  if (lyzrUserId) {
    criteria.lyzrUserId = lyzrUserId;
  }

  const docs = await TicketModel.find(criteria).sort({ created_at: -1 }).lean();

  return (docs as TicketDoc[]).map(mapTicket);
}
