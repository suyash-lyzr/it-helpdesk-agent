import { NextRequest, NextResponse } from "next/server"
import { getTickets } from "@/lib/ticket-store"
import { getTeamPerformance } from "@/lib/analytics-store"

export async function GET(request: NextRequest) {
  try {
    const { tickets } = getTickets()
    const teamPerformance = getTeamPerformance(tickets)

    return NextResponse.json({
      success: true,
      data: teamPerformance,
    })
  } catch (error) {
    console.error("Error fetching team performance:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch team performance",
      },
      { status: 500 }
    )
  }
}

