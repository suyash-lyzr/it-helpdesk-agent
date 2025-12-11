// Ticket types matching the Ticket Generator Agent output structure

export type TicketType = "incident" | "access_request" | "request";
export type TicketPriority = "low" | "medium" | "high";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SuggestedTeam =
  | "Network"
  | "Endpoint Support"
  | "Application Support"
  | "IAM"
  | "Security"
  | "DevOps";
export type TicketSource = "chat" | "email" | "integration" | "manual";
export type LifecycleStage =
  | "new"
  | "triage"
  | "in_progress"
  | "waiting_for_user"
  | "resolved"
  | "closed";

// Input structure from Ticket Generator Agent
export interface TicketGeneratorInput {
  ticket_ready: boolean;
  ticket_type: TicketType;
  title: string;
  description: string;
  user_name: string;
  app_or_system: string;
  priority: TicketPriority;
  collected_details: Record<string, unknown>;
  suggested_team: SuggestedTeam;
  status: TicketStatus;
}

// Full ticket structure stored in the system
export interface Ticket {
  id: string;
  /**
   * Internal owner of the ticket in this app.
   * This maps to the authenticated Lyzr user (lyzrUserId)
   * so that all tickets, counts and analytics are scoped per-user.
   */
  lyzrUserId?: string;
  ticket_type: TicketType;
  title: string;
  description: string;
  user_name: string;
  app_or_system: string;
  priority: TicketPriority;
  collected_details: Record<string, unknown>;
  suggested_team: SuggestedTeam;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  // Enterprise admin console fields
  sla_due_at?: string; // ISO timestamp
  sla_breached_at?: string; // ISO timestamp
  asset_id?: string;
  external_ids?: Record<string, string>; // e.g., { jira: "JRA-2031", servicenow: "INC-001234" }
  source?: TicketSource;
  assignee?: string;
  first_response_at?: string; // ISO timestamp
  resolved_at?: string; // ISO timestamp
  reopened_count?: number;
  lifecycle_stage?: LifecycleStage;
  csat_score?: number;
  csat_comment?: string;
  csat_submitted_at?: string;
}

// Request body for creating a ticket
export interface CreateTicketRequest {
  ticket_type: TicketType;
  title: string;
  description: string;
  /**
   * Optional owner for server-to-server calls.
   * In the app we always derive this from the authenticated user
   * (cookie or headers) and do not rely on clients to set it.
   */
  lyzrUserId?: string;
  user_name?: string;
  app_or_system?: string;
  priority?: TicketPriority;
  collected_details?: Record<string, unknown>;
  suggested_team?: SuggestedTeam;
  status?: TicketStatus;
  // Enterprise fields
  source?: TicketSource;
  assignee?: string;
  asset_id?: string;
  external_ids?: Record<string, string>;
  // Timestamp fields (for demo data seeding)
  created_at?: string;
  first_response_at?: string;
  resolved_at?: string;
  csat_score?: number;
  lifecycle_stage?: LifecycleStage;
  sla_breached_at?: string;
  // Conversation history (optional, for preserving full chat)
  conversation?: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: string;
  }>;
}

// Request body for updating a ticket
export interface UpdateTicketRequest {
  ticket_type?: TicketType;
  title?: string;
  description?: string;
  user_name?: string;
  app_or_system?: string;
  priority?: TicketPriority;
  collected_details?: Record<string, unknown>;
  suggested_team?: SuggestedTeam;
  status?: TicketStatus;
  assignee?: string;
  first_response_at?: string;
  resolved_at?: string;
  sla_due_at?: string;
  sla_breached_at?: string;
  lifecycle_stage?: LifecycleStage;
  reopened_count?: number;
  csat_score?: number;
  csat_comment?: string;
  csat_submitted_at?: string;
}

// API response structures
export interface TicketResponse {
  success: boolean;
  data: Ticket;
  message?: string;
}

export interface TicketsListResponse {
  success: boolean;
  data: Ticket[];
  total: number;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// Query parameters for listing tickets
export interface TicketQueryParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  ticket_type?: TicketType;
  suggested_team?: SuggestedTeam;
  limit?: number;
  offset?: number;
  /**
   * Internal owner filter – when present, all queries are scoped
   * to this Lyzr user ID so each user only sees their own tickets.
   */
  lyzrUserId?: string;
}

// Helper function to generate ticket ID
export function generateTicketId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

// Helper function to validate ticket type
export function isValidTicketType(type: string): type is TicketType {
  return ["incident", "access_request", "request"].includes(type);
}

// Helper function to validate priority
export function isValidPriority(priority: string): priority is TicketPriority {
  return ["low", "medium", "high"].includes(priority);
}

// Helper function to validate status
export function isValidStatus(status: string): status is TicketStatus {
  return ["open", "in_progress", "resolved", "closed"].includes(status);
}

// Helper function to validate suggested team
export function isValidTeam(team: string): team is SuggestedTeam {
  return [
    "Network",
    "Endpoint Support",
    "Application Support",
    "IAM",
    "Security",
    "DevOps",
  ].includes(team);
}

// Helper function to calculate MTTR (Mean Time To Resolution) in hours
export function calculateMTTR(tickets: Ticket[]): number {
  const resolvedTickets = tickets.filter((t) => t.resolved_at && t.created_at);
  if (resolvedTickets.length === 0) return 0;

  const totalHours = resolvedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.created_at).getTime();
    const resolved = new Date(ticket.resolved_at!).getTime();
    return sum + (resolved - created) / (1000 * 60 * 60);
  }, 0);

  return totalHours / resolvedTickets.length;
}

// Helper function to calculate First Response Time in hours
export function calculateFirstResponseTime(tickets: Ticket[]): number {
  const respondedTickets = tickets.filter(
    (t) => t.first_response_at && t.created_at
  );
  if (respondedTickets.length === 0) return 0;

  const totalHours = respondedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.created_at).getTime();
    const firstResponse = new Date(ticket.first_response_at!).getTime();
    return sum + (firstResponse - created) / (1000 * 60 * 60);
  }, 0);

  return totalHours / respondedTickets.length;
}

// Helper function to check if SLA is breached
export function checkSLABreach(ticket: Ticket): boolean {
  if (!ticket.sla_due_at) return false;
  const slaDue = new Date(ticket.sla_due_at).getTime();

  // Check if ticket is resolved/closed
  if (ticket.status === "resolved" || ticket.status === "closed") {
    // For resolved tickets, check if they were resolved after SLA deadline
    if (ticket.resolved_at) {
      const resolvedTime = new Date(ticket.resolved_at).getTime();
      return resolvedTime > slaDue;
    }
    return false;
  }

  // For open/in-progress tickets, check if current time exceeds SLA
  const now = new Date().getTime();
  return now > slaDue;
}

// Helper function to get lifecycle stage from status
export function getLifecycleStage(ticket: Ticket): LifecycleStage {
  if (ticket.lifecycle_stage) return ticket.lifecycle_stage;

  // Map status to lifecycle stage
  switch (ticket.status) {
    case "open":
      return "new";
    case "in_progress":
      return "in_progress";
    case "resolved":
      return "resolved";
    case "closed":
      return "closed";
    default:
      return "new";
  }
}

// Helper function to calculate SLA compliance percentage
// Only considers resolved/closed tickets - checks if they were resolved before SLA due date
// Returns null when there are no resolved tickets with SLA (no data to calculate)
export function calculateSLACompliance(tickets: Ticket[]): number | null {
  if (tickets.length === 0) return null;

  // Only consider resolved or closed tickets with SLA due dates
  const resolvedTicketsWithSLA = tickets.filter(
    (t) => (t.status === "resolved" || t.status === "closed") && t.sla_due_at
  );

  if (resolvedTicketsWithSLA.length === 0) return null;

  // Check if each resolved ticket was resolved before or on the SLA due date
  const compliant = resolvedTicketsWithSLA.filter((t) => {
    if (!t.resolved_at) {
      // If no resolved_at timestamp, check if updated_at (when resolved) is before SLA due
      const resolvedAt = new Date(t.updated_at).getTime();
      const slaDue = new Date(t.sla_due_at!).getTime();
      return resolvedAt <= slaDue;
    }
    const resolved = new Date(t.resolved_at).getTime();
    const slaDue = new Date(t.sla_due_at!).getTime();
    return resolved <= slaDue;
  }).length;

  return (compliant / resolvedTicketsWithSLA.length) * 100;
}
