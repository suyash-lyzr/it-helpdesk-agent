# IT Ticket Manager - Short Tool Descriptions

Use these concise descriptions when adding tools to your agents in Lyzr Studio.

---

## createTicket

**Tool Name:** `Openapi-it_ticket_manager-createTicket`

**Short Description:**
```
You MUST call this tool after generating ticket data. Pass ticket_type, title, description, user_name, app_or_system, priority, collected_details, and suggested_team. Use the exact ticket ID returned in the response - never invent IDs.
```

---

## getTickets

**Tool Name:** `Openapi-it_ticket_manager-getTickets`

**Short Description:**
```
Use this tool to retrieve a list of existing tickets. Optional filters: status, priority, ticket_type, suggested_team, limit, or search query. Returns an array of ticket objects with all details.
```

---

## getTicketById

**Tool Name:** `Openapi-it_ticket_manager-getTicketById`

**Short Description:**
```
Use this tool to get detailed information about a specific ticket by its ID. Pass the ticket ID (e.g., "TKT-ABC123") as the id parameter. Returns the complete ticket object or an error if not found.
```

---

## updateTicket

**Tool Name:** `Openapi-it_ticket_manager-updateTicket`

**Short Description:**
```
Use this tool to update an existing ticket's status, priority, or other fields. Pass the ticket ID and only the fields you want to update (status, priority, title, description, etc.). Returns the updated ticket object.
```

---

## deleteTicket

**Tool Name:** `Openapi-it_ticket_manager-deleteTicket`

**Short Description:**
```
Use this tool to permanently delete a ticket. Pass the ticket ID as the id parameter. Use with caution - this action cannot be undone. Prefer updating status to "closed" instead of deleting.
```

---

## Quick Copy Reference

### For Ticket Generator Agent (Primary Tools):
- **createTicket**: `You MUST call this tool after generating ticket data. Pass ticket_type, title, description, user_name, app_or_system, priority, collected_details, and suggested_team. Use the exact ticket ID returned in the response - never invent IDs.`

### For Manager Agent (Optional - if you want ticket lookup):
- **getTickets**: `Use this tool to retrieve a list of existing tickets. Optional filters: status, priority, ticket_type, suggested_team, limit, or search query. Returns an array of ticket objects with all details.`
- **getTicketById**: `Use this tool to get detailed information about a specific ticket by its ID. Pass the ticket ID (e.g., "TKT-ABC123") as the id parameter. Returns the complete ticket object or an error if not found.`

### For Admin/Management (Advanced):
- **updateTicket**: `Use this tool to update an existing ticket's status, priority, or other fields. Pass the ticket ID and only the fields you want to update (status, priority, title, description, etc.). Returns the updated ticket object.`
- **deleteTicket**: `Use this tool to permanently delete a ticket. Pass the ticket ID as the id parameter. Use with caution - this action cannot be undone. Prefer updating status to "closed" instead of deleting.`

