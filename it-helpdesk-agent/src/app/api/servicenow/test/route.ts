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

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function refreshAccessToken(
  refreshToken: string,
  instanceUrl: string,
  clientId: string,
  clientSecret: string
): Promise<RefreshTokenResponse> {
  const tokenUrl = `${instanceUrl}/oauth_token.do`;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  return (await response.json()) as RefreshTokenResponse;
}

async function testServiceNowConnection(
  accessToken: string,
  instanceUrl: string
): Promise<{
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}> {
  const testUrl = `${instanceUrl}/api/now/table/incident?sysparm_limit=1`;

  const response = await fetch(testUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ServiceNow API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  return {
    success: true,
    message: "Successfully connected to ServiceNow",
    data: {
      incidentCount: data.result?.length || 0,
    },
  };
}

// POST /api/servicenow/test
export async function POST() {
  const clientId = process.env.SN_CLIENT_ID;
  const clientSecret = process.env.SN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        success: false,
        message:
          "ServiceNow is not configured. Please set environment variables.",
      },
      { status: 500, headers: corsHeaders }
    );
  }

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
          success: false,
          message:
            "ServiceNow is not connected. Please complete OAuth setup first.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    let accessToken = integration.accessToken;
    const instanceUrl = integration.instanceUrl;

    if (!accessToken || !instanceUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing access token or instance URL.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if token is expired
    const now = new Date();
    const tokenExpiry = integration.tokenExpiry
      ? new Date(integration.tokenExpiry)
      : null;

    if (tokenExpiry && now >= tokenExpiry) {
      // Token expired, refresh it
      if (!integration.refreshToken) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Access token expired and no refresh token available. Please reconnect.",
          },
          { status: 401, headers: corsHeaders }
        );
      }

      try {
        const refreshData = await refreshAccessToken(
          integration.refreshToken,
          instanceUrl,
          clientId,
          clientSecret
        );

        // Update tokens in database
        const newExpiry = new Date();
        newExpiry.setSeconds(newExpiry.getSeconds() + refreshData.expires_in);

        await IntegrationOAuthModel.findOneAndUpdate(
          { provider: "servicenow" },
          {
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token,
            tokenExpiry: newExpiry,
          }
        );

        accessToken = refreshData.access_token;
      } catch (refreshError) {
        console.error("Token refresh error:", refreshError);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to refresh access token. Please reconnect.",
          },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Test the connection
    const result = await testServiceNowConnection(accessToken, instanceUrl);

    // Update last test timestamp
    await IntegrationOAuthModel.findOneAndUpdate(
      { provider: "servicenow" },
      { lastTestAt: new Date() }
    );

    // Log the test success
    appendLog({
      provider: "servicenow",
      action: "connection.test.succeeded",
      actor: "admin",
      details: {
        incident_count: result.data?.incidentCount || 0,
        message: result.message,
      },
    });

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error("ServiceNow test connection error:", error);

    // Log the test failure
    appendLog({
      provider: "servicenow",
      action: "connection.test.failed",
      actor: "admin",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to test connection",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
