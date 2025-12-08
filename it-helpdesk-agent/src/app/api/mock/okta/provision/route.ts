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

// POST /api/mock/okta/provision
// Body: { username, groups, duration }
// Response (spec):
// { "status":"provisioned", "external_id":"OKTA-REQ-1001", "message":"Provisioning started (demo)" }
export async function POST(request: NextRequest) {
  const body = await request.json()

  const externalId = "OKTA-REQ-1001"

  appendLog({
    provider: "okta",
    action: "demo.provision_user",
    actor: "admin",
    details: {
      username: body.username,
      groups: body.groups,
      duration: body.duration,
      external_id: externalId,
    },
  })

  return NextResponse.json(
    {
      status: "provisioned",
      external_id: externalId,
      message: "Provisioning started (demo)",
    },
    { headers: corsHeaders },
  )
}


