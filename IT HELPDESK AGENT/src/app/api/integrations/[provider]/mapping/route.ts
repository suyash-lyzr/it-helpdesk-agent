import { NextRequest, NextResponse } from "next/server"
import { getIntegration, saveMapping } from "@/lib/integrations-store"
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

// GET returns current mapping; POST saves a new mapping
export async function GET(
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

  const integration = getIntegration(provider)
  if (!integration) {
    return NextResponse.json(
      { success: false, message: "Integration not found" },
      { status: 404, headers: corsHeaders },
    )
  }

  return NextResponse.json(
    {
      success: true,
      provider,
      mappings: integration.mapping ?? {},
    },
    { headers: corsHeaders },
  )
}

export async function POST(
  request: NextRequest,
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

  const body = await request.json()
  const mappings = body?.mappings ?? {}

  const updated = saveMapping(provider, mappings)

  if (!updated) {
    return NextResponse.json(
      { success: false, message: "Integration not found" },
      { status: 404, headers: corsHeaders },
    )
  }

  return NextResponse.json(
    {
      success: true,
      provider,
      mappings: updated.mapping ?? {},
    },
    { headers: corsHeaders },
  )
}


