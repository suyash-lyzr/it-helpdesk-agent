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

// Seed function to initialize with enhanced mock data
function seedTickets() {
  const now = new Date()
  const mockTickets: Ticket[] = [
    {
      id: "TKT-MISJ5WY3-6ANU",
      ticket_type: "incident",
      title: "Internet connectivity issue reported",
      description: "The user reports that the internet is not working. Internet connectivity is completely unavailable and needs immediate resolution as it blocks all online work.",
      user_name: "john.doe@company.com",
      app_or_system: "general",
      priority: "high",
      collected_details: {},
      suggested_team: "Network",
      status: "new",
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      sla_due_at: new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString(), // 22 hours from now
      source: "chat",
      lifecycle_stage: "new",
    },
    {
      id: "TKT-ACCESS-001",
      ticket_type: "access_request",
      title: "Request access to Jira",
      description: "User needs access to Jira for new role",
      user_name: "jane.smith@company.com",
      app_or_system: "Jira",
      priority: "medium",
      collected_details: { application: "Jira", role: "Project Manager" },
      suggested_team: "IAM",
      status: "open",
      created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updated_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      sla_due_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      source: "email",
      assignee: "Jane Smith",
      first_response_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      lifecycle_stage: "triage",
    },
    {
      id: "TKT-VPN-002",
      ticket_type: "incident",
      title: "VPN connection failure",
      description: "Unable to connect to corporate VPN from remote location",
      user_name: "bob.johnson@company.com",
      app_or_system: "VPN",
      priority: "high",
      collected_details: { location: "Remote", vpn_client: "Cisco AnyConnect" },
      suggested_team: "Network",
      status: "in_progress",
      created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      sla_due_at: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
      asset_id: "ASSET-002",
      external_ids: { servicenow: "INC-001234" },
      source: "chat",
      assignee: "Bob Johnson",
      first_response_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      lifecycle_stage: "in_progress",
    },
    {
      id: "TKT-LAPTOP-003",
      ticket_type: "request",
      title: "Laptop replacement request",
      description: "Current laptop is slow and needs replacement",
      user_name: "alice.williams@company.com",
      app_or_system: "Laptop",
      priority: "low",
      collected_details: { current_laptop: "Dell Latitude 5540", reason: "Performance" },
      suggested_team: "Endpoint Support",
      status: "resolved",
      created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updated_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      sla_due_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      asset_id: "AST-LPT-001",
      source: "manual",
      assignee: "Alice Williams",
      first_response_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lifecycle_stage: "resolved",
    },
    {
      id: "TKT-SLA-BREACH-004",
      ticket_type: "incident",
      title: "Email server outage",
      description: "Email server is down, affecting all users",
      user_name: "charlie.brown@company.com",
      app_or_system: "Email",
      priority: "high",
      collected_details: { server: "mail.company.com", affected_users: "All" },
      suggested_team: "Application Support",
      status: "in_progress",
      created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      sla_due_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Breached
      sla_breached_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      source: "integration",
      assignee: "Charlie Brown",
      first_response_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      lifecycle_stage: "in_progress",
      reopened_count: 1,
    },
    {
      id: "TKT-ENDPOINT-005",
      ticket_type: "incident",
      title: "Laptop screen flickering issue",
      description: "Laptop screen flickers intermittently, making it difficult to work. Issue started 2 days ago.",
      user_name: "david.miller@company.com",
      app_or_system: "Laptop",
      priority: "medium",
      collected_details: { device: "Dell Latitude 7420", issue: "Screen flickering" },
      suggested_team: "Endpoint Support",
      status: "in_progress",
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      sla_due_at: new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString(),
      asset_id: "AST-LPT-001",
      source: "chat",
      assignee: "David Miller",
      first_response_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      lifecycle_stage: "in_progress",
    },
    {
      id: "TKT-APP-006",
      ticket_type: "incident",
      title: "Jira not loading properly",
      description: "Jira dashboard is not loading, getting timeout errors when trying to access tickets.",
      user_name: "emily.chen@company.com",
      app_or_system: "Jira",
      priority: "high",
      collected_details: { application: "Jira", error: "Timeout errors" },
      suggested_team: "Application Support",
      status: "open",
      created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      sla_due_at: new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString(),
      source: "chat",
      lifecycle_stage: "triage",
    },
    {
      id: "TKT-IAM-007",
      ticket_type: "access_request",
      title: "Request access to Okta Admin Console",
      description: "Need admin access to Okta for managing user accounts in new role.",
      user_name: "frank.wilson@company.com",
      app_or_system: "Okta",
      priority: "medium",
      collected_details: { application: "Okta", role: "IT Admin", access_level: "Admin Console" },
      suggested_team: "IAM",
      status: "new",
      created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      sla_due_at: new Date(now.getTime() + 47 * 60 * 60 * 1000).toISOString(),
      source: "email",
      lifecycle_stage: "new",
    },
    {
      id: "TKT-SECURITY-008",
      ticket_type: "incident",
      title: "Suspicious login attempt detected",
      description: "Security system detected multiple failed login attempts from unknown IP address.",
      user_name: "security@company.com",
      app_or_system: "Security",
      priority: "high",
      collected_details: { ip_address: "192.168.1.100", attempts: 5, account: "user@company.com" },
      suggested_team: "Security",
      status: "in_progress",
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      sla_due_at: new Date(now.getTime() + 21 * 60 * 60 * 1000).toISOString(),
      source: "integration",
      assignee: "Security Team",
      first_response_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      lifecycle_stage: "in_progress",
    },
    {
      id: "TKT-DEVOPS-009",
      ticket_type: "incident",
      title: "CI/CD pipeline failure",
      description: "Production deployment pipeline is failing at build stage. All deployments blocked.",
      user_name: "devops@company.com",
      app_or_system: "CI/CD",
      priority: "high",
      collected_details: { pipeline: "production-deploy", stage: "build", error: "Dependency resolution failed" },
      suggested_team: "DevOps",
      status: "in_progress",
      created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      sla_due_at: new Date(now.getTime() + 19 * 60 * 60 * 1000).toISOString(),
      source: "integration",
      assignee: "DevOps Team",
      first_response_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      lifecycle_stage: "in_progress",
    },
    {
      id: "TKT-NETWORK-010",
      ticket_type: "incident",
      title: "WiFi connection dropping frequently",
      description: "WiFi connection keeps dropping every few minutes. Unable to maintain stable connection.",
      user_name: "grace.lee@company.com",
      app_or_system: "WiFi",
      priority: "medium",
      collected_details: { location: "Office Floor 3", access_point: "AP-03", frequency: "Every 5 minutes" },
      suggested_team: "Network",
      status: "open",
      created_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      sla_due_at: new Date(now.getTime() + 40 * 60 * 60 * 1000).toISOString(),
      source: "chat",
      lifecycle_stage: "triage",
    },
  ]

  tickets = mockTickets
}

// Initialize with seed data on first load
if (tickets.length === 0) {
  seedTickets()
}

// Create a new ticket
export function createTicket(data: CreateTicketRequest): Ticket {
  const now = new Date().toISOString()

  // Calculate SLA due date based on priority (24h for high, 48h for medium, 72h for low)
  const slaHours = data.priority === "high" ? 24 : data.priority === "medium" ? 48 : 72
  const slaDueAt = new Date(now)
  slaDueAt.setHours(slaDueAt.getHours() + slaHours)

  const newTicket: Ticket = {
    id: generateTicketId(),
    ticket_type: data.ticket_type,
    title: data.title,
    description: data.description,
    user_name: data.user_name || "unknown",
    app_or_system: data.app_or_system || "general",
    priority: data.priority || "medium",
    collected_details: data.collected_details || {},
    suggested_team: data.suggested_team || "Application Support",
    status: data.status || "new",
    created_at: now,
    updated_at: now,
    // Enterprise fields
    sla_due_at: slaDueAt.toISOString(),
    source: data.source || "chat",
    assignee: data.assignee,
    asset_id: data.asset_id,
    external_ids: data.external_ids,
    lifecycle_stage: "new",
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

