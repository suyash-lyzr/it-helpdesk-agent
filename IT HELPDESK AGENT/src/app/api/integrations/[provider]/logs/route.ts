import { NextRequest, NextResponse } from "next/server"
import { getLogsForProvider } from "@/lib/integrations-store"
import type { IntegrationProvider } from "@/lib/integrations-types"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

// GET /api/integrations/:provider/logs
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  const provider = toProvider(params.provider)
  if (!provider) {
    return NextResponse.json(
      { success: false, message: "Unknown provider" },
      { status: 400, headers: corsHeaders },
    )
  }

  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Number.parseInt(limitParam, 10) || 20 : 20

  const logs = getLogsForProvider(provider, limit)

  return NextResponse.json(
    {
      success: true,
      provider,
      logs,
    },
    { headers: corsHeaders },
  )
}


