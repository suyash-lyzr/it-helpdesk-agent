import { NextRequest, NextResponse } from "next/server"
import { getTickets } from "@/lib/ticket-store"
import { getAccessRequestAnalytics } from "@/lib/analytics-store"

export async function GET(request: NextRequest) {
  try {
    const { tickets } = getTickets()
    const analytics = getAccessRequestAnalytics(tickets)

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error("Error fetching access request analytics:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch access request analytics",
      },
      { status: 500 }
    )
  }
}

