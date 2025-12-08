export type TicketStatus = "Open" | "In Progress" | "Resolved"
export type TicketPriority = "High" | "Medium" | "Low"
export type TicketDepartment = "IT" | "HR" | "Finance" | "Operations" | "Marketing"
export type TicketCategory = "Hardware" | "Software" | "Network" | "Access" | "Other"

export interface Ticket {
  id: string
  title: string
  department: TicketDepartment
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  createdAt: Date
  description?: string
  assignee?: string
}

export const mockTickets: Ticket[] = [
  {
    id: "TKT-001",
    title: "Cannot access email on laptop",
    department: "IT",
    category: "Software",
    priority: "High",
    status: "Open",
    createdAt: new Date("2024-12-02T09:00:00"),
    description: "Outlook keeps crashing when trying to open",
    assignee: "John Smith",
  },
  {
    id: "TKT-002",
    title: "New employee laptop setup",
    department: "HR",
    category: "Hardware",
    priority: "Medium",
    status: "In Progress",
    createdAt: new Date("2024-12-01T14:30:00"),
    description: "Setup laptop for new hire starting next week",
    assignee: "Sarah Johnson",
  },
  {
    id: "TKT-003",
    title: "VPN connection issues",
    department: "Operations",
    category: "Network",
    priority: "High",
    status: "Open",
    createdAt: new Date("2024-12-02T11:15:00"),
    description: "Unable to connect to VPN from home office",
  },
  {
    id: "TKT-004",
    title: "Request access to shared drive",
    department: "Finance",
    category: "Access",
    priority: "Low",
    status: "Resolved",
    createdAt: new Date("2024-11-28T08:45:00"),
    description: "Need access to Q4 reports folder",
    assignee: "Mike Chen",
  },
  {
    id: "TKT-005",
    title: "Printer not working in conference room B",
    department: "Operations",
    category: "Hardware",
    priority: "Medium",
    status: "In Progress",
    createdAt: new Date("2024-11-30T16:00:00"),
    description: "Printer shows offline status",
    assignee: "John Smith",
  },
  {
    id: "TKT-006",
    title: "Software license renewal",
    department: "Marketing",
    category: "Software",
    priority: "Medium",
    status: "Resolved",
    createdAt: new Date("2024-11-25T10:30:00"),
    description: "Adobe Creative Suite license expiring",
    assignee: "Sarah Johnson",
  },
  {
    id: "TKT-007",
    title: "Password reset request",
    department: "HR",
    category: "Access",
    priority: "High",
    status: "Resolved",
    createdAt: new Date("2024-12-01T09:00:00"),
    description: "Account locked after failed login attempts",
    assignee: "Mike Chen",
  },
  {
    id: "TKT-008",
    title: "Slow internet connection",
    department: "IT",
    category: "Network",
    priority: "Medium",
    status: "Open",
    createdAt: new Date("2024-12-02T13:45:00"),
    description: "Internet speed significantly reduced in building A",
  },
  {
    id: "TKT-009",
    title: "Monitor flickering issue",
    department: "Finance",
    category: "Hardware",
    priority: "Low",
    status: "In Progress",
    createdAt: new Date("2024-11-29T11:00:00"),
    description: "External monitor flickers intermittently",
    assignee: "John Smith",
  },
  {
    id: "TKT-010",
    title: "Install project management software",
    department: "Marketing",
    category: "Software",
    priority: "Low",
    status: "Resolved",
    createdAt: new Date("2024-11-27T15:30:00"),
    description: "Install Asana on team laptops",
    assignee: "Sarah Johnson",
  },
]

export function getTicketCounts(tickets: Ticket[]) {
  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter((t) => t.status === "Resolved").length,
  }
}

export function filterTickets(
  tickets: Ticket[],
  searchQuery: string,
  statusFilter?: TicketStatus
): Ticket[] {
  let filtered = tickets

  if (statusFilter) {
    filtered = filtered.filter((t) => t.status === statusFilter)
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (t) =>
        t.id.toLowerCase().includes(query) ||
        t.title.toLowerCase().includes(query) ||
        t.department.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
    )
  }

  return filtered
}

