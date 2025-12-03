// In-memory ticket store for managing tickets
// Can be replaced with a database in production

import {
  Ticket,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketQueryParams,
  generateTicketId,
} from "./ticket-types"

// In-memory storage for tickets
// Start with empty array - tickets will be created via API
let tickets: Ticket[] = []

// Create a new ticket
export function createTicket(data: CreateTicketRequest): Ticket {
  const now = new Date().toISOString()

  const newTicket: Ticket = {
    id: generateTicketId(),
    ticket_type: data.ticket_type,
    title: data.title,
    description: data.description,
    user_name: data.user_name || "unknown",
    app_or_system: data.app_or_system || "general",
    priority: data.priority || "medium",
    collected_details: data.collected_details || {},
    suggested_team: data.suggested_team || "IT Helpdesk",
    status: data.status || "new",
    created_at: now,
    updated_at: now,
  }

  tickets.unshift(newTicket) // Add to beginning of array
  return newTicket
}

// Get all tickets with optional filtering
export function getTickets(params?: TicketQueryParams): {
  tickets: Ticket[]
  total: number
} {
  let filtered = [...tickets]

  if (params?.status) {
    filtered = filtered.filter((t) => t.status === params.status)
  }

  if (params?.priority) {
    filtered = filtered.filter((t) => t.priority === params.priority)
  }

  if (params?.ticket_type) {
    filtered = filtered.filter((t) => t.ticket_type === params.ticket_type)
  }

  if (params?.suggested_team) {
    filtered = filtered.filter((t) => t.suggested_team === params.suggested_team)
  }

  const total = filtered.length

  // Apply pagination
  const offset = params?.offset || 0
  const limit = params?.limit || 50

  filtered = filtered.slice(offset, offset + limit)

  return { tickets: filtered, total }
}

// Get a single ticket by ID
export function getTicketById(id: string): Ticket | null {
  return tickets.find((t) => t.id === id) || null
}

// Update a ticket
export function updateTicket(
  id: string,
  data: UpdateTicketRequest
): Ticket | null {
  const index = tickets.findIndex((t) => t.id === id)

  if (index === -1) {
    return null
  }

  const updatedTicket: Ticket = {
    ...tickets[index],
    ...data,
    updated_at: new Date().toISOString(),
  }

  tickets[index] = updatedTicket
  return updatedTicket
}

// Delete a ticket
export function deleteTicket(id: string): boolean {
  const index = tickets.findIndex((t) => t.id === id)

  if (index === -1) {
    return false
  }

  tickets.splice(index, 1)
  return true
}

// Get ticket counts by status
export function getTicketCounts(): {
  total: number
  new: number
  open: number
  in_progress: number
  resolved: number
  closed: number
} {
  return {
    total: tickets.length,
    new: tickets.filter((t) => t.status === "new").length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  }
}

// Search tickets by title or description
export function searchTickets(query: string): Ticket[] {
  const lowerQuery = query.toLowerCase()
  return tickets.filter(
    (t) =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.user_name.toLowerCase().includes(lowerQuery) ||
      t.app_or_system.toLowerCase().includes(lowerQuery)
  )
}

