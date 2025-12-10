import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { IntegrationOAuthModel } from "@/lib/models/integration";
import crypto from "crypto";
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

// POST /api/integrations/servicenow/start-oauth
export async function POST() {
  try {
    await connectToDatabase();

    const integration = await IntegrationOAuthModel.findOne({
      provider: "servicenow",
    });

    if (!integration || !integration.instanceUrl || !integration.clientId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Credentials not saved. Please save credentials first.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const grantType = integration.grantType || "authorization_code";

    if (grantType === "authorization_code") {
      // Generate state for CSRF protection
      const state = crypto.randomBytes(32).toString("hex");

      // Save state to database
      await IntegrationOAuthModel.findOneAndUpdate(
        { provider: "servicenow" },
        { oauthState: state }
      );

      // Build authorization URL
      const redirectUri =
        integration.redirectUri ||
        `${
          process.env.BASE_URL || "http://localhost:3000"
        }/oauth/callback/servicenow`;

      const authorizeUrl = new URL(`${integration.instanceUrl}/oauth_auth.do`);
      authorizeUrl.searchParams.set("response_type", "code");
      authorizeUrl.searchParams.set("client_id", integration.clientId);
      authorizeUrl.searchParams.set("redirect_uri", redirectUri);
      authorizeUrl.searchParams.set("state", state);

      // Log OAuth start
      appendLog({
        provider: "servicenow",
        action: "oauth.started",
        actor: "admin",
        details: {
          grantType: "authorization_code",
          instanceUrl: integration.instanceUrl,
        },
      });

      return NextResponse.json(
        {
          ok: true,
          authorizeUrl: authorizeUrl.toString(),
          state,
        },
        { headers: corsHeaders }
      );
    } else {
      // For client_credentials, we'll handle token exchange directly
      return NextResponse.json(
        {
          ok: false,
          message: "Use the token endpoint for client_credentials grant type",
        },
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Error starting ServiceNow OAuth:", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to start OAuth",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
