import { NextRequest, NextResponse } from "next/server"
import { appendLog } from "@/lib/integrations-store"
import { addLiveEvent, appendAuditLog } from "@/lib/analytics-store"
import { getTickets, updateTicket } from "@/lib/ticket-store"
import type { IntegrationProvider, WebhookSampleEvent } from "@/lib/integrations-types"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

const SAMPLE_EVENTS: Record<string, WebhookSampleEvent> = {
  "jira.ticket.updated": {
    provider: "jira",
    event: "ticket.updated",
    external_id: "JRA-2031",
    changes: {
      status: "In Progress",
      assignee: "alice",
    },
  },
  "servicenow.incident.resolved": {
    provider: "servicenow",
    event: "incident.resolved",
    external_id: "INC-001234",
    resolution: "Replaced faulty NIC",
  },
  "okta.user.provisioned": {
    provider: "okta",
    event: "user.provisioned",
    external_id: "OKTA-REQ-1001",
    result: "success",
  },
  "google.device.offline": {
    provider: "google",
    event: "device.offline",
    external_id: "GWA-DEVICE-45",
    last_seen: "2025-12-03T09:00:00Z",
  },
}

// POST /api/webhook/replay
// Body: { provider, sampleEventId }
export async function POST(request: NextRequest) {
  const body = await request.json()
  const provider = body.provider as IntegrationProvider | undefined
  const sampleEventId = body.sampleEventId as string | undefined

  if (!provider || !sampleEventId) {
    return NextResponse.json(
      {
        success: false,
        message: "provider and sampleEventId are required",
      },
      { status: 400, headers: corsHeaders },
    )
  }

  const event = SAMPLE_EVENTS[sampleEventId]

  if (!event || event.provider !== provider) {
    return NextResponse.json(
      {
        success: false,
        message: "Sample event not found for provider",
      },
      { status: 404, headers: corsHeaders },
    )
  }

  appendLog({
    provider,
    action: "webhook.replay",
    actor: "admin",
    details: {
      sampleEventId,
      event,
    },
  })

  // Add live event to analytics store
  const eventDescription = `${event.provider} ${event.event}: ${event.external_id}`
  addLiveEvent({
    type: "external_id_created",
    actor: "System",
    description: eventDescription,
    externalId: event.external_id,
  })

  // Try to find and update related ticket if external_id matches
  const { tickets } = getTickets()
  const relatedTicket = tickets.find(
    (t) => t.external_ids && Object.values(t.external_ids).includes(event.external_id)
  )

  if (relatedTicket && event.event === "ticket.updated") {
    // Update ticket status if provided in changes
    const changes = (event as { changes?: { status?: string } }).changes
    if (changes?.status) {
      const normalizedStatus = changes.status.toLowerCase().replace(" ", "_")
      if (normalizedStatus === "in_progress" || normalizedStatus === "resolved" || normalizedStatus === "closed" || normalizedStatus === "open") {
        updateTicket(relatedTicket.id, {
          status: normalizedStatus as "in_progress" | "resolved" | "closed" | "open",
        })
      }
    }
  }

  appendAuditLog("system", "webhook_replayed", `Replayed ${event.provider} webhook: ${sampleEventId}`)

  // For demo we simply return the event payload. In production this would
  // fan out to whatever internal webhook handlers would normally process it.
  return NextResponse.json(
    {
      success: true,
      provider,
      event,
      ticketId: relatedTicket?.id,
      message: `Webhook replayed: ${eventDescription}`,
      externalId: event.external_id,
    },
    { headers: corsHeaders },
  )
}


