import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { IntegrationOAuthModel } from "@/lib/models/integration";
import { decrypt } from "@/lib/encryption";
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

// POST /api/integrations/servicenow/exchange
// This endpoint is called from the callback route to exchange the code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json(
        {
          ok: false,
          message: "Authorization code is missing",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    const integration = await IntegrationOAuthModel.findOne({
      provider: "servicenow",
    });

    if (!integration || !integration.instanceUrl || !integration.clientId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Credentials not found. Please save credentials first.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate state if present
    if (state && integration.oauthState && state !== integration.oauthState) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid state parameter. Possible CSRF attack.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!integration.encryptedClientSecret) {
      return NextResponse.json(
        {
          ok: false,
          message: "Client secret not found. Please save credentials again.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Decrypt client secret
    let clientSecret: string;
    try {
      clientSecret = decrypt(integration.encryptedClientSecret);
    } catch (decryptError) {
      console.error("Decryption error:", decryptError);
      return NextResponse.json(
        {
          ok: false,
          message: "Failed to decrypt client secret",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const redirectUri =
      integration.redirectUri ||
      `${
        process.env.BASE_URL || "http://localhost:3000"
      }/oauth/callback/servicenow`;

    // Exchange code for tokens
    const tokenData = await exchangeCodeForTokens(
      code,
      integration.instanceUrl,
      integration.clientId,
      clientSecret,
      redirectUri
    );

    // Calculate token expiry
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokenData.expires_in);

    // Save tokens (but don't mark as connected - user must press Connect button)
    await IntegrationOAuthModel.findOneAndUpdate(
      { provider: "servicenow" },
      {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry,
        oauthState: null, // Clear state after successful exchange
        // Don't set connected: true - user must explicitly connect
        metadata: {
          scope: tokenData.scope,
          tokenType: tokenData.token_type,
        },
      }
    );

    // Log successful exchange
    appendLog({
      provider: "servicenow",
      action: "oauth.exchanged",
      actor: "admin",
      details: {
        instanceUrl: integration.instanceUrl,
        scope: tokenData.scope,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        tokensSaved: true,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("ServiceNow OAuth exchange error:", error);

    // Log exchange failure
    appendLog({
      provider: "servicenow",
      action: "oauth.exchange.failed",
      actor: "admin",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to exchange code",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
