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

// POST /api/mock/google/check-device
// Response (spec):
// { "device_status":"online", "last_sync":"2025-12-03T10:00:00Z", "os":"macOS 14.2" }
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  appendLog({
    provider: "google",
    action: "demo.check_device",
    actor: "admin",
    details: body,
  })

  return NextResponse.json(
    {
      device_status: "online",
      last_sync: "2025-12-03T10:00:00Z",
      os: "macOS 14.2",
    },
    { headers: corsHeaders },
  )
}


