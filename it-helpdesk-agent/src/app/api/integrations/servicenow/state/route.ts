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

// GET /api/integrations/servicenow/state
export async function GET() {
  try {
    await connectToDatabase();

    const integration = await IntegrationOAuthModel.findOne({
      provider: "servicenow",
    });

    if (!integration || !integration.instanceUrl || !integration.clientId) {
      return NextResponse.json(
        {
          instance: null,
          clientId: null,
          grantType: null,
          connected: false,
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        instance: integration.instanceUrl,
        clientId: integration.clientId,
        grantType: integration.grantType || "authorization_code",
        connected: integration.connected || false,
        hasTokens: !!integration.accessToken,
        savedAt: integration.savedAt?.toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching ServiceNow state:", error);
    return NextResponse.json(
      {
        instance: null,
        clientId: null,
        grantType: null,
        connected: false,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
