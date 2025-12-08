import { NextRequest, NextResponse } from "next/server"
import { markTested } from "@/lib/integrations-store"
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

// POST /api/integrations/:provider/test
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerParam } = await params
  const provider = toProvider(providerParam)
  if (!provider) {
    return NextResponse.json(
      { success: false, message: "Unknown provider" },
      { status: 400, headers: corsHeaders },
    )
  }

  markTested(provider)

  if (provider === "jira") {
    return NextResponse.json(
      {
        ok: true,
        sample_issue: "JRA-2031",
        message: "Demo Jira connected successfully.",
      },
      { headers: corsHeaders },
    )
  }

  if (provider === "servicenow") {
    return NextResponse.json(
      {
        ok: true,
        sample_incident: "INC-001234",
        message: "Demo ServiceNow connected successfully.",
      },
      { headers: corsHeaders },
    )
  }

  if (provider === "okta") {
    return NextResponse.json(
      {
        ok: true,
        sample_user: "OKTA-UID-12",
        message: "Demo Okta connected successfully.",
      },
      { headers: corsHeaders },
    )
  }

  if (provider === "google") {
    return NextResponse.json(
      {
        ok: true,
        sample_user: "GWA-USER-123",
        message: "Demo Google Workspace connected successfully.",
      },
      { headers: corsHeaders },
    )
  }

  return NextResponse.json(
    { ok: false, message: "Unsupported provider" },
    { status: 400, headers: corsHeaders },
  )
}


