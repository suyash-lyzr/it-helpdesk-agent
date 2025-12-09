import { NextRequest, NextResponse } from "next/server";
import { getTickets } from "@/lib/ticket-store";
import { getTeamPerformance } from "@/lib/analytics-store";
import { applyTicketFilters } from "@/lib/filter-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const start = startDate ? new Date(startDate) : undefined;
    if (start) start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : undefined;
    if (end) end.setHours(23, 59, 59, 999);

    const { tickets: allTickets } = await getTickets();

    // Apply filters
    const filteredTickets = applyTicketFilters(allTickets, {
      team: searchParams.get("team") || undefined,
      priority: searchParams.get("priority") || undefined,
      category: searchParams.get("category") || undefined,
      assignee: searchParams.get("assignee") || undefined,
      slaStatus: searchParams.get("sla_status") || undefined,
      source: searchParams.get("source") || undefined,
      startDate: start,
      endDate: end,
    });

    const teamPerformance = getTeamPerformance(filteredTickets);

    return NextResponse.json({
      success: true,
      data: teamPerformance,
    });
  } catch (error) {
    console.error("Error fetching team performance:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch team performance",
      },
      { status: 500 }
    );
  }
}
