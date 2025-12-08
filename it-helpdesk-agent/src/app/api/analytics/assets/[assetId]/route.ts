import { NextRequest, NextResponse } from "next/server";
import { getTickets } from "@/lib/ticket-store";
import {
  getAssetById,
  getAssetTicketHistory,
  getAssetMetrics,
} from "@/lib/mock-assets";
import { getAssetData } from "@/lib/analytics-store";

export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const { assetId } = params;
    const asset = getAssetById(assetId);

    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: "Asset not found",
        },
        { status: 404 }
      );
    }

    const { tickets } = await getTickets();
    const ticketHistory = getAssetTicketHistory(assetId, tickets);
    const assetData = getAssetData(assetId, tickets);

    return NextResponse.json({
      success: true,
      data: {
        asset,
        ticketHistory,
        ticketCount: assetData.ticketCount,
        tickets: assetData.tickets,
      },
    });
  } catch (error) {
    console.error("Error fetching asset data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch asset data",
      },
      { status: 500 }
    );
  }
}
