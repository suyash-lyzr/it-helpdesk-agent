import { NextRequest, NextResponse } from "next/server"
import { getTickets } from "@/lib/ticket-store"
import { getTopIssues } from "@/lib/analytics-store"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    const { tickets } = getTickets()
    const topIssues = getTopIssues(tickets, limit)

    return NextResponse.json({
      success: true,
      data: topIssues,
    })
  } catch (error) {
    console.error("Error fetching top issues:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top issues",
      },
      { status: 500 }
    )
  }
}

