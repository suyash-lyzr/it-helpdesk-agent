// Ticket types matching the Ticket Generator Agent output structure

export type TicketType = "incident" | "access_request" | "request"
export type TicketPriority = "low" | "medium" | "high"
export type TicketStatus = "new" | "open" | "in_progress" | "resolved" | "closed"
export type SuggestedTeam = "IT Helpdesk" | "Network" | "Security" | "DevOps"

// Input structure from Ticket Generator Agent
export interface TicketGeneratorInput {
  ticket_ready: boolean
  ticket_type: TicketType
  title: string
  description: string
  user_name: string
  app_or_system: string
  priority: TicketPriority
  collected_details: Record<string, unknown>
  suggested_team: SuggestedTeam
  status: TicketStatus
}

// Full ticket structure stored in the system
export interface Ticket {
  id: string
  ticket_type: TicketType
  title: string
  description: string
  user_name: string
  app_or_system: string
  priority: TicketPriority
  collected_details: Record<string, unknown>
  suggested_team: SuggestedTeam
  status: TicketStatus
  created_at: string
  updated_at: string
}

// Request body for creating a ticket
export interface CreateTicketRequest {
  ticket_type: TicketType
  title: string
  description: string
  user_name?: string
  app_or_system?: string
  priority?: TicketPriority
  collected_details?: Record<string, unknown>
  suggested_team?: SuggestedTeam
  status?: TicketStatus
}

// Request body for updating a ticket
export interface UpdateTicketRequest {
  ticket_type?: TicketType
  title?: string
  description?: string
  user_name?: string
  app_or_system?: string
  priority?: TicketPriority
  collected_details?: Record<string, unknown>
  suggested_team?: SuggestedTeam
  status?: TicketStatus
}

// API response structures
export interface TicketResponse {
  success: boolean
  data: Ticket
  message?: string
}

export interface TicketsListResponse {
  success: boolean
  data: Ticket[]
  total: number
  message?: string
}

export interface DeleteResponse {
  success: boolean
  message: string
}

// Query parameters for listing tickets
export interface TicketQueryParams {
  status?: TicketStatus
  priority?: TicketPriority
  ticket_type?: TicketType
  suggested_team?: SuggestedTeam
  limit?: number
  offset?: number
}

// Helper function to generate ticket ID
export function generateTicketId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TKT-${timestamp}-${random}`
}

// Helper function to validate ticket type
export function isValidTicketType(type: string): type is TicketType {
  return ["incident", "access_request", "request"].includes(type)
}

// Helper function to validate priority
export function isValidPriority(priority: string): priority is TicketPriority {
  return ["low", "medium", "high"].includes(priority)
}

// Helper function to validate status
export function isValidStatus(status: string): status is TicketStatus {
  return ["new", "open", "in_progress", "resolved", "closed"].includes(status)
}

// Helper function to validate suggested team
export function isValidTeam(team: string): team is SuggestedTeam {
  return ["IT Helpdesk", "Network", "Security", "DevOps"].includes(team)
}

