import { NextResponse } from "next/server";
import crypto from "crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/oauth/servicenow/start
// Returns an authorization URL for ServiceNow OAuth
export async function GET() {
  const instanceUrl = process.env.SN_INSTANCE_URL;
  const clientId = process.env.SN_CLIENT_ID;
  const redirectUri = process.env.SN_REDIRECT_URI;

  if (!instanceUrl || !clientId || !redirectUri) {
    return NextResponse.json(
      {
        success: false,
        message:
          "ServiceNow OAuth is not configured. Set SN_INSTANCE_URL, SN_CLIENT_ID, and SN_REDIRECT_URI in your environment to enable OAuth.",
      },
      { status: 400, headers: corsHeaders }
    );
  }

  // Generate a random state for CSRF protection
  const state = crypto.randomBytes(32).toString("hex");

  // Build the ServiceNow OAuth authorization URL
  const authorizeUrl = new URL(`${instanceUrl}/oauth_auth.do`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.json(
    {
      success: true,
      authorizeUrl: authorizeUrl.toString(),
      state,
    },
    { headers: corsHeaders }
  );
}
