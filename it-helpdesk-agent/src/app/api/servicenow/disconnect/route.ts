import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { IntegrationOAuthModel } from "@/lib/models/integration";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// POST /api/servicenow/disconnect
export async function POST() {
  try {
    // Connect to database
    await connectToDatabase();

    // Update integration to disconnect
    await IntegrationOAuthModel.findOneAndUpdate(
      { provider: "servicenow" },
      {
        accessToken: undefined,
        refreshToken: undefined,
        tokenExpiry: undefined,
        connected: false,
        connectedAt: undefined,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "ServiceNow has been disconnected successfully.",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("ServiceNow disconnect error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to disconnect",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
