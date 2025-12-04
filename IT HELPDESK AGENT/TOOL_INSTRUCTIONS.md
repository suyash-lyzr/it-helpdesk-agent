# IT Ticket Manager - Tool Instructions

Copy the relevant instruction for each tool when adding it to your Ticket Generator Agent.

---

## 1. createTicket

**Tool Name:** `Openapi-it_ticket_manager-createTicket`

**Instruction:**

```
Use this tool to save a new ticket to the IT Helpdesk system after generating the ticket data.

WHEN TO USE:
- After you have collected all necessary information and generated a structured ticket object
- When escalating an issue that couldn't be resolved through troubleshooting
- When processing an access request that needs IT team action

REQUIRED PARAMETERS:
- ticket_type: Must be one of "incident", "access_request", or "request"
- title: A short one-line summary of the issue or request
- description: Detailed description with bullet points explaining the problem

OPTIONAL PARAMETERS:
- user_name: Name of the user who reported the issue (default: "unknown")
- app_or_system: The affected application or system like "VPN", "Outlook", "Jira" (default: "general")
- priority: "low", "medium", or "high" based on impact (default: "medium")
- collected_details: JSON object with additional structured data like OS, error messages, etc.
- suggested_team: "IT Helpdesk", "Network", "Security", or "DevOps" (default: "IT Helpdesk")

AFTER CALLING:
- The tool returns a ticket object with a unique ID (e.g., "TKT-ABC123")
- Include this ticket ID in your response to confirm the ticket was created
- Never invent or make up ticket IDs - only use the ID returned by this tool
```

---

## 2. getTickets

**Tool Name:** `Openapi-it_ticket_manager-getTickets`

**Instruction:**

```
Use this tool to retrieve a list of existing tickets from the IT Helpdesk system.

WHEN TO USE:
- When the user asks about their existing tickets
- When you need to check if a similar ticket already exists
- When providing a summary of open or pending tickets

OPTIONAL FILTER PARAMETERS:
- status: Filter by "new", "open", "in_progress", "resolved", or "closed"
- priority: Filter by "low", "medium", or "high"
- ticket_type: Filter by "incident", "access_request", or "request"
- suggested_team: Filter by team assignment
- limit: Maximum number of tickets to return (default: 50)
- search: Search text to find tickets by title, description, or user name

RESPONSE:
- Returns an array of ticket objects with all details
- Use this data to inform the user about their ticket status
```

---

## 3. getTicketById

**Tool Name:** `Openapi-it_ticket_manager-getTicketById`

**Instruction:**

```
Use this tool to get detailed information about a specific ticket using its ID.

WHEN TO USE:
- When the user asks about a specific ticket by ID (e.g., "What's the status of TKT-ABC123?")
- When you need to check the current status of a previously created ticket
- Before updating a ticket to verify its current state

REQUIRED PARAMETER:
- id: The ticket ID (e.g., "TKT-ABC123")

RESPONSE:
- Returns the complete ticket object with all fields
- If ticket not found, returns an error message
```

---

## 4. updateTicket

**Tool Name:** `Openapi-it_ticket_manager-updateTicket`

**Instruction:**

```
Use this tool to update an existing ticket's information.

WHEN TO USE:
- When changing the status of a ticket (e.g., marking as resolved)
- When updating priority based on new information
- When adding details to an existing ticket
- When reassigning a ticket to a different team

REQUIRED PARAMETER:
- id: The ticket ID to update (e.g., "TKT-ABC123")

OPTIONAL UPDATE PARAMETERS (only include fields you want to change):
- status: New status - "new", "open", "in_progress", "resolved", or "closed"
- priority: New priority - "low", "medium", or "high"
- title: Updated title
- description: Updated description
- suggested_team: New team assignment
- collected_details: Additional information to add

COMMON STATUS TRANSITIONS:
- new → open (when IT starts reviewing)
- open → in_progress (when actively working on it)
- in_progress → resolved (when issue is fixed)
- resolved → closed (when user confirms resolution)

RESPONSE:
- Returns the updated ticket object with all changes applied
```

---

## 5. deleteTicket

**Tool Name:** `Openapi-it_ticket_manager-deleteTicket`

**Instruction:**

```
Use this tool to permanently delete a ticket from the system.

WHEN TO USE:
- Only when explicitly requested by an admin user
- When a ticket was created by mistake
- When removing duplicate tickets

REQUIRED PARAMETER:
- id: The ticket ID to delete (e.g., "TKT-ABC123")

CAUTION:
- This action is permanent and cannot be undone
- Always confirm with the user before deleting
- Prefer updating status to "closed" instead of deleting for audit purposes

RESPONSE:
- Returns a success message if deleted
- Returns an error if ticket not found
```

---

## Quick Copy Reference

| Tool          | Copy This Instruction                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- |
| createTicket  | Use to save new tickets. Requires: ticket_type, title, description. Returns ticket with unique ID. |
| getTickets    | Use to list tickets with optional filters (status, priority, type, team, search).                  |
| getTicketById | Use to get details of a specific ticket by ID.                                                     |
| updateTicket  | Use to update ticket status, priority, or details. Requires ticket ID.                             |
| deleteTicket  | Use to permanently delete a ticket. Requires ticket ID. Use with caution.                          |

---

## Recommended Tool Configuration for Ticket Generator Agent

For the **Ticket Generator Agent**, add these tools with instructions:

### Primary Tool: createTicket

```
After generating the ticket JSON, ALWAYS call this tool to save the ticket.
Pass all collected information: ticket_type, title, description, user_name, app_or_system, priority, collected_details, suggested_team.
Include the returned ticket ID in your final output.
```

### Optional: getTickets (if agent needs to check for duplicates)

```
Use to check if a similar ticket already exists before creating a new one.
Search by user name or issue keywords.
```
