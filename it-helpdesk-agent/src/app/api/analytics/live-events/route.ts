import { NextRequest, NextResponse } from "next/server";
import {
  getLiveEvents,
  addLiveEvent,
  generateLiveEventsFromTickets,
} from "@/lib/analytics-store";
import { getTickets } from "@/lib/ticket-store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get("since");

    const sinceDate = since ? new Date(since) : undefined;

    // Get tickets from database
    const { tickets } = await getTickets();

    // Generate events from real tickets
    const ticketEvents = generateLiveEventsFromTickets(tickets, sinceDate);

    // Get manually added events (from addLiveEvent calls)
    const manualEvents = getLiveEvents(sinceDate);

    // Combine and sort by timestamp (newest first)
    const allEvents = [...ticketEvents, ...manualEvents].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      data: allEvents,
    });
  } catch (error) {
    console.error("Error fetching live events:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch live events",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ticketId, actor, description, externalId } = body;

    const event = addLiveEvent({
      type,
      ticketId,
      actor,
      description,
      externalId,
    });

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error adding live event:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add live event",
      },
      { status: 500 }
    );
  }
}
