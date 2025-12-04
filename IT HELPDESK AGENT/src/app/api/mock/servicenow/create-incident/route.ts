import { NextRequest, NextResponse } from "next/server"
import { appendLog } from "@/lib/integrations-store"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// POST /api/mock/servicenow/create-incident
// Response (spec):
// { "external_id":"INC-001234", "status":"created", "url": "https://servicenow.example.com/incident/INC-001234" }
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const externalId = "INC-001234"

  appendLog({
    provider: "servicenow",
    action: "demo.create_incident",
    actor: "admin",
    details: {
      external_id: externalId,
      payload: body,
    },
  })

  return NextResponse.json(
    {
      external_id: externalId,
      status: "created",
      url: "https://servicenow.example.com/incident/INC-001234",
    },
    { headers: corsHeaders },
  )
}


