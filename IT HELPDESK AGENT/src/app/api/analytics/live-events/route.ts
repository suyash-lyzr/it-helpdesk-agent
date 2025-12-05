import { NextRequest, NextResponse } from "next/server"
import { getLiveEvents, addLiveEvent } from "@/lib/analytics-store"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const since = searchParams.get("since")

    const sinceDate = since ? new Date(since) : undefined
    const events = getLiveEvents(sinceDate)

    return NextResponse.json({
      success: true,
      data: events,
    })
  } catch (error) {
    console.error("Error fetching live events:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch live events",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ticketId, actor, description, externalId } = body

    const event = addLiveEvent({
      type,
      ticketId,
      actor,
      description,
      externalId,
    })

    return NextResponse.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error("Error adding live event:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add live event",
      },
      { status: 500 }
    )
  }
}

