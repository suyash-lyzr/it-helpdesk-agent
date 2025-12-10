import { NextRequest, NextResponse } from "next/server";
import { getTickets } from "@/lib/ticket-store";
import { getAccessRequestAnalytics } from "@/lib/analytics-store";
import { applyTicketFilters } from "@/lib/filter-utils";

function getLyzrUserIdFromRequest(request: NextRequest): string | null {
  // 1) Primary source: browser UI cookie set by AuthProvider
  const cookieUserId = request.cookies.get("user_id")?.value;
  if (cookieUserId && cookieUserId.trim() !== "") {
    return cookieUserId.trim();
  }

  // 2) Fallback for server-to-server / Lyzr tools: explicit headers
  const headerUserId =
    request.headers.get("x-lyzr-user-id") ||
    request.headers.get("x-user-id") ||
    request.headers.get("user_id");

  if (headerUserId && headerUserId.trim() !== "") {
    return headerUserId.trim();
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const lyzrUserId = getLyzrUserIdFromRequest(request);
    if (!lyzrUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing user context. A valid user_id cookie or x-lyzr-user-id header is required.",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodDays = parseInt(searchParams.get("period") || "30", 10);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const start = startDate ? new Date(startDate) : undefined;
    if (start) start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : undefined;
    if (end) end.setHours(23, 59, 59, 999);

    const { tickets: allTickets } = await getTickets({ lyzrUserId });

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

    const analytics = getAccessRequestAnalytics(filteredTickets, periodDays);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching access request analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch access request analytics",
      },
      { status: 500 }
    );
  }
}
