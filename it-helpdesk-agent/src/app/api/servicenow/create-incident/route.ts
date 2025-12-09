import { NextRequest, NextResponse } from "next/server";
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

// POST /api/servicenow/create-incident
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const {
      title,
      description,
      priority = "3",
      assignment_group = "IT Support",
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and description are required",
        },
        { status: 400, headers: corsHeaders }
      );
    }

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

    // Create incident in ServiceNow
    const incidentData = {
      short_description: `[Lyzr Test] ${title}`,
      description: description,
      urgency: priority,
      impact: priority,
      state: "1", // New
      assignment_group: assignment_group,
    };

    const createResponse = await fetch(
      `${instanceUrl}/api/now/table/incident`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(incidentData),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();

      // Log the failure
      appendLog({
        provider: "servicenow",
        action: "incident.create.failed",
        actor: "admin",
        details: {
          error: errorText,
          status: createResponse.status,
        },
      });

      throw new Error(
        `ServiceNow API error: ${createResponse.status} ${errorText}`
      );
    }

    const result = await createResponse.json();
    const incident = result.result;

    // Log the success
    appendLog({
      provider: "servicenow",
      action: "incident.created",
      actor: "admin",
      details: {
        incident_number: incident.number,
        sys_id: incident.sys_id,
        title: title,
        source: "test-card",
      },
    });

    return NextResponse.json(
      {
        success: true,
        number: incident.number,
        sys_id: incident.sys_id,
        url: `${instanceUrl}/nav_to.do?uri=incident.do?sys_id=${incident.sys_id}`,
        message: `Successfully created incident ${incident.number}`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("ServiceNow create incident error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create incident",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
