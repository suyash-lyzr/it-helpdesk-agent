import { NextRequest, NextResponse } from "next/server";
import { getTickets } from "@/lib/ticket-store";
import {
  getAssetById,
  getAssetTicketHistory,
  getAssetMetrics,
} from "@/lib/mock-assets";
import { getAssetData } from "@/lib/analytics-store";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
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

    const { assetId } = await params;
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

    const { tickets } = await getTickets({ lyzrUserId });
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
