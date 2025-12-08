import { NextRequest, NextResponse } from "next/server";
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

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

async function exchangeCodeForTokens(
  code: string,
  instanceUrl: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenResponse> {
  const tokenUrl = `${instanceUrl}/oauth_token.do`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to exchange code for tokens: ${response.status} ${errorText}`
    );
  }

  return (await response.json()) as TokenResponse;
}

// GET /api/oauth/servicenow/callback
export async function GET(request: NextRequest) {
  const instanceUrl = process.env.SN_INSTANCE_URL;
  const clientId = process.env.SN_CLIENT_ID;
  const clientSecret = process.env.SN_CLIENT_SECRET;
  const redirectUri = process.env.SN_REDIRECT_URI;

  if (!instanceUrl || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL("/integrations/servicenow?error=missing_config", request.url)
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Check for OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/integrations/servicenow?error=${encodeURIComponent(error)}`,
        request.url
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/integrations/servicenow?error=missing_code", request.url)
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenData = await exchangeCodeForTokens(
      code,
      instanceUrl,
      clientId,
      clientSecret,
      redirectUri
    );

    // Calculate token expiry date
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokenData.expires_in);

    // Connect to database
    await connectToDatabase();

    // Store tokens in database
    await IntegrationOAuthModel.findOneAndUpdate(
      { provider: "servicenow" },
      {
        provider: "servicenow",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry,
        instanceUrl,
        connected: true,
        connectedAt: new Date(),
        metadata: {
          scope: tokenData.scope,
          tokenType: tokenData.token_type,
        },
      },
      { upsert: true, new: true }
    );

    // Redirect back to integration page with success
    return NextResponse.redirect(
      new URL("/integrations/servicenow?connected=1", request.url)
    );
  } catch (error) {
    console.error("ServiceNow OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/integrations/servicenow?error=${encodeURIComponent(
          error instanceof Error ? error.message : "unknown_error"
        )}`,
        request.url
      )
    );
  }
}
