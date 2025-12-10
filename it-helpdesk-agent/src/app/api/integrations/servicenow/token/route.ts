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
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
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

async function getClientCredentialsToken(
  instanceUrl: string,
  clientId: string,
  clientSecret: string
): Promise<TokenResponse> {
  const tokenUrl = `${instanceUrl}/oauth_token.do`;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
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
      `Failed to get client credentials token: ${response.status} ${errorText}`
    );
  }

  return (await response.json()) as TokenResponse;
}

// POST /api/integrations/servicenow/token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, grantType } = body;

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

    const actualGrantType =
      grantType || integration.grantType || "authorization_code";

    let tokenData: TokenResponse;

    if (actualGrantType === "client_credentials") {
      // Get token using client credentials
      tokenData = await getClientCredentialsToken(
        integration.instanceUrl,
        integration.clientId,
        clientSecret
      );
    } else if (code) {
      // Exchange authorization code for tokens
      const redirectUri =
        integration.redirectUri ||
        `${
          process.env.BASE_URL || "http://localhost:3000"
        }/oauth/callback/servicenow`;

      tokenData = await exchangeCodeForTokens(
        code,
        integration.instanceUrl,
        integration.clientId,
        clientSecret,
        redirectUri
      );
    } else {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Authorization code is required for authorization_code grant type",
        },
        { status: 400, headers: corsHeaders }
      );
    }

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
        // Don't set connected: true - user must explicitly connect
        metadata: {
          scope: tokenData.scope,
          tokenType: tokenData.token_type,
          grantType: actualGrantType,
        },
      }
    );

    // Log token exchange
    appendLog({
      provider: "servicenow",
      action: "token.exchanged",
      actor: "admin",
      details: {
        grantType: actualGrantType,
        expiresIn: tokenData.expires_in,
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
    console.error("Error exchanging token:", error);

    // Log token exchange failure
    appendLog({
      provider: "servicenow",
      action: "token.exchange.failed",
      actor: "admin",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to exchange token",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
