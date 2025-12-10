import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { IntegrationOAuthModel } from "@/lib/models/integration";
import { appendLog } from "@/lib/integrations-store";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// POST /api/integrations/servicenow/connect
// Explicitly connect the integration after credentials and tokens are saved
export async function POST() {
  try {
    await connectToDatabase();

    const integration = await IntegrationOAuthModel.findOne({
      provider: "servicenow",
    });

    if (!integration) {
      return NextResponse.json(
        {
          ok: false,
          message: "Credentials not found. Please save credentials first.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!integration.accessToken) {
      return NextResponse.json(
        {
          ok: false,
          message: "Tokens not found. Please complete OAuth setup first.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Mark as connected
    await IntegrationOAuthModel.findOneAndUpdate(
      { provider: "servicenow" },
      {
        connected: true,
        connectedAt: new Date(),
      }
    );

    // Log connection
    appendLog({
      provider: "servicenow",
      action: "integration.connected",
      actor: "admin",
      details: {
        instanceUrl: integration.instanceUrl,
        connectedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        connected: true,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error connecting ServiceNow:", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to connect",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
