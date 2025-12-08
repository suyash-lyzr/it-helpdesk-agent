import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { IntegrationOAuthModel } from "@/lib/models/integration";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/servicenow/status
export async function GET() {
  try {
    // Connect to database
    await connectToDatabase();

    // Retrieve stored integration
    const integration = await IntegrationOAuthModel.findOne({
      provider: "servicenow",
    });

    if (!integration || !integration.connected) {
      return NextResponse.json(
        {
          connected: false,
          message: "ServiceNow is not connected.",
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        connected: true,
        instanceUrl: integration.instanceUrl,
        connectedAt: integration.connectedAt,
        lastTestAt: integration.lastTestAt,
        metadata: integration.metadata,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("ServiceNow status check error:", error);
    return NextResponse.json(
      {
        connected: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to check connection status",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
