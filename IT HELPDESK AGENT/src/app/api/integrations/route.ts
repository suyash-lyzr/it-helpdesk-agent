import { NextResponse } from "next/server"
import { getIntegrations } from "@/lib/integrations-store"

// Basic CORS headers to match existing ticket APIs (demo-friendly)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

// GET /api/integrations — list all integrations and their status
export async function GET() {
  try {
    const integrations = getIntegrations()

    return NextResponse.json(
      {
        success: true,
        data: integrations,
        message: "Integrations retrieved successfully",
      },
      { headers: corsHeaders },
    )
  } catch (error) {
    console.error("Error fetching integrations:", error)
    return NextResponse.json(
      {
        success: false,
        data: [],
        message: "Failed to fetch integrations",
      },
      { status: 500, headers: corsHeaders },
    )
  }
}


