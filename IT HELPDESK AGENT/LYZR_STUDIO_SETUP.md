# Lyzr Studio Integration Guide

This guide explains how to configure your Ticket Generator Agent in Lyzr Studio to use the IT Ticket Manager API.

## Prerequisites

1. Your IT Helpdesk Agent app running locally (e.g., `http://localhost:3000`)
2. [ngrok](https://ngrok.com/) installed for exposing your local server
3. Access to Lyzr Studio

## Step 1: Start Your Local Server

```bash
cd "IT HELPDESK AGENT"
npm run dev
```

Your app should be running at `http://localhost:3000`

## Step 2: Expose Your Server with ngrok

Open a new terminal and run:

```bash
ngrok http 3000
```

You'll get a public URL like `https://xxxx-xx-xx-xxx-xxx.ngrok-free.app`

**Copy this URL** - you'll need it in the next step.

## Step 3: Update the OpenAPI Schema

1. Open the file `openapi-schema.json` in the project root
2. Find the `servers` section at the top
3. Replace `https://your-ngrok-url.ngrok.io` with your actual ngrok URL:

```json
"servers": [
  {
    "url": "https://xxxx-xx-xx-xxx-xxx.ngrok-free.app",
    "description": "Development server"
  }
]
```

## Step 4: Add Custom Tool in Lyzr Studio

1. Go to Lyzr Studio → **Tools** section
2. Click **"+ Add Custom Tool"**
3. Fill in the form:

### Tool Set Name
```
IT Ticket Manager
```

### OpenAPI Schema
Copy the entire contents of `openapi-schema.json` and paste it here.

### Default Headers (JSON)
```json
{
  "Content-Type": "application/json"
}
```

### Default Query Parameters (JSON)
```json
{}
```

4. Click **Save** to add the tool

## Step 5: Enable Tool in Ticket Generator Agent

1. Navigate to your **Ticket Generator Agent** in Lyzr Studio
2. Go to **Tool Configuration** section
3. Click **"+ Add"**
4. Find and select **"IT Ticket Manager"** from the list
5. Click **Update** to save changes

## Step 6: Update Ticket Generator Agent Instructions

Add the following to your Ticket Generator Agent's instructions:

```
After generating a ticket object, ALWAYS use the "createTicket" tool from IT Ticket Manager to save the ticket to the system.

When calling createTicket, pass the ticket data with these fields:
- ticket_type: "incident" | "access_request" | "request"
- title: The ticket title
- description: The detailed description
- user_name: The user's name
- app_or_system: The affected application
- priority: "low" | "medium" | "high"
- collected_details: Any additional structured data
- suggested_team: "IT Helpdesk" | "Network" | "Security" | "DevOps"

After successfully creating a ticket, include the returned ticket ID in your response.
```

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List all tickets (with optional filters) |
| POST | `/api/tickets` | Create a new ticket |
| GET | `/api/tickets/{id}` | Get a specific ticket |
| PUT | `/api/tickets/{id}` | Update a ticket |
| DELETE | `/api/tickets/{id}` | Delete a ticket |

### Query Parameters for GET /api/tickets

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (new, open, in_progress, resolved, closed) |
| `priority` | string | Filter by priority (low, medium, high) |
| `ticket_type` | string | Filter by type (incident, access_request, request) |
| `suggested_team` | string | Filter by team |
| `limit` | integer | Max tickets to return |
| `search` | string | Search in title, description, user name |

## Testing the Integration

### Test 1: Create a Ticket via API

```bash
curl -X POST https://your-ngrok-url.ngrok-free.app/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_type": "incident",
    "title": "Test ticket from API",
    "description": "- Testing the API integration\n- Created via curl",
    "user_name": "Test User",
    "app_or_system": "Test System",
    "priority": "low",
    "suggested_team": "IT Helpdesk"
  }'
```

### Test 2: Get All Tickets

```bash
curl https://your-ngrok-url.ngrok-free.app/api/tickets
```

### Test 3: Test via Lyzr Studio

In your IT Helpdesk Orchestrator chat, type:
> "My VPN is not working, I can't connect at all"

The Orchestrator should:
1. Route to Troubleshooting Agent
2. If escalation needed, call Ticket Generator Agent
3. Ticket Generator creates the ticket using the API
4. Respond with confirmation including the ticket ID

## Troubleshooting

### "Connection refused" error
- Make sure your local server is running (`npm run dev`)
- Make sure ngrok is connected to the correct port

### "CORS error"
- The API routes include CORS headers, but if you still see issues, ensure your ngrok URL is correct

### "Tool not found" in Lyzr Studio
- Refresh the page after adding the tool
- Make sure the OpenAPI schema is valid JSON

### Tickets not appearing in UI
- Refresh the tickets page
- Check the browser console for errors
- Verify the API is returning data: visit `/api/tickets` directly

## Example Workflow

1. User: "I need access to GitHub for my new project"
2. Manager Agent → Routes to Access Request Agent
3. Access Request Agent → Collects details, returns complete request
4. Manager Agent → Calls Ticket Generator Agent
5. Ticket Generator Agent → Creates structured ticket JSON
6. Ticket Generator Agent → Calls `createTicket` API
7. API → Returns ticket with ID (e.g., "TKT-M5K1H-ABCD")
8. Manager Agent → Tells user: "Your access request has been submitted. Ticket ID: TKT-M5K1H-ABCD"
9. User can view ticket in IT Helpdesk Agent app at `/tickets`

