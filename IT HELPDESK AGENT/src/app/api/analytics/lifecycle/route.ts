import { NextRequest, NextResponse } from "next/server"
import { getTickets } from "@/lib/ticket-store"
import { getLifecycleFunnel } from "@/lib/analytics-store"

export async function GET(request: NextRequest) {
  try {
    const { tickets } = getTickets()
    const lifecycleData = getLifecycleFunnel(tickets)

    return NextResponse.json({
      success: true,
      data: lifecycleData,
    })
  } catch (error) {
    console.error("Error fetching lifecycle funnel:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch lifecycle funnel data",
      },
      { status: 500 }
    )
  }
}

