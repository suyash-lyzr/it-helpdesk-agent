import { NextRequest, NextResponse } from "next/server"
import { disconnectIntegration } from "@/lib/integrations-store"
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

// POST /api/integrations/:provider/disconnect
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

  const updated = disconnectIntegration(provider)

  if (!updated) {
    return NextResponse.json(
      {
        success: false,
        message: "Integration not found",
      },
      { status: 404, headers: corsHeaders },
    )
  }

  return NextResponse.json(
    {
      success: true,
      provider,
      status: updated.status,
      message: "Integration disconnected",
    },
    { headers: corsHeaders },
  )
}


