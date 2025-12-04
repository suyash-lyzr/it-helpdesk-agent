import { NextRequest, NextResponse } from "next/server"
import {
  connectIntegration,
  getIntegration,
} from "@/lib/integrations-store"
import type { IntegrationProvider } from "@/lib/integrations-types"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
}

function toProvider(param: string): IntegrationProvider | null {
  if (
    param === "jira" ||
    param === "servicenow" ||
    param === "okta" ||
    param === "google"
  ) {
    return param
  }
  return null
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// POST /api/integrations/:provider/connect
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  try {
    const provider = toProvider(params.provider)
    if (!provider) {
      return NextResponse.json(
        { success: false, message: "Unknown provider" },
        { status: 400, headers: corsHeaders },
      )
    }

    const body = await request.json()

    // Demo mode vs real is controlled by payload; for now no real API calls.
    const mode = body.mode === "real" ? "real" : "demo"

    if (provider === "jira") {
      // Jira demo connect response (spec)
      const updated = connectIntegration({
        provider,
        mode,
        maskedToken: "xxxx-xxxx-ABCD",
      })

      if (!updated) {
        return NextResponse.json(
          { success: false, message: "Failed to update Jira integration" },
          { status: 500, headers: corsHeaders },
        )
      }

      return NextResponse.json(
        {
          provider: "jira",
          status: "connected",
          mode,
          masked_token: "xxxx-xxxx-ABCD",
          connected_at: updated.connectedAt ?? "2025-12-04T12:00:00Z",
        },
        { headers: corsHeaders },
      )
    }

    if (provider === "servicenow") {
      connectIntegration({ provider, mode })

      return NextResponse.json(
        {
          provider: "servicenow",
          status: "connected",
          sample_incident: "INC-001234",
        },
        { headers: corsHeaders },
      )
    }

    if (provider === "okta") {
      connectIntegration({ provider, mode })
      return NextResponse.json(
        {
          provider: "okta",
          status: "connected",
          mode: "demo",
          sample_user: "OKTA-UID-12",
        },
        { headers: corsHeaders },
      )
    }

    if (provider === "google") {
      connectIntegration({ provider, mode })
      return NextResponse.json(
        {
          provider: "google",
          status: "connected",
          mode: "demo",
          sample_user: "GWA-USER-123",
        },
        { headers: corsHeaders },
      )
    }

    // Fallback (should not be reached)
    const integration = getIntegration(provider)
    return NextResponse.json(
      { success: true, data: integration },
      { headers: corsHeaders },
    )
  } catch (error) {
    console.error("Error connecting integration:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect integration",
      },
      { status: 500, headers: corsHeaders },
    )
  }
}


