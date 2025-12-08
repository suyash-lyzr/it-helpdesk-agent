import { NextRequest, NextResponse } from "next/server";
import { getTickets } from "@/lib/ticket-store";
import { getSLAFunnel } from "@/lib/analytics-store";

export async function GET(request: NextRequest) {
  try {
    const { tickets } = await getTickets();
    const funnelData = getSLAFunnel(tickets);

    return NextResponse.json({
      success: true,
      data: funnelData,
    });
  } catch (error) {
    console.error("Error fetching SLA funnel:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch SLA funnel data",
      },
      { status: 500 }
    );
  }
}
