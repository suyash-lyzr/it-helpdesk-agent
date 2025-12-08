import { NextRequest, NextResponse } from "next/server"
import { getAuditLogs } from "@/lib/analytics-store"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    const logs = getAuditLogs(limit)

    return NextResponse.json({
      success: true,
      data: logs,
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit logs",
      },
      { status: 500 }
    )
  }
}

