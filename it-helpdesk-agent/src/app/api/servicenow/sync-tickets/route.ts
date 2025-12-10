import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { IntegrationOAuthModel } from "@/lib/models/integration";
import { TicketModel } from "@/lib/models/ticket";
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

interface ServiceNowIncidentResponse {
  result: {
    sys_id: string;
    number: string;
  };
}

async function createServiceNowIncident(
  accessToken: string,
  instanceUrl: string,
  ticket: {
    title: string;
    description: string;
    priority: string;
    user_name?: string;
    status?: string;
    suggested_team?: string;
  }
): Promise<{ sys_id: string; number: string }> {
  const incidentData = {
    short_description: ticket.title,
    description: ticket.description,
    urgency:
      ticket.priority === "high"
        ? "1"
        : ticket.priority === "medium"
        ? "2"
        : "3",
    impact:
      ticket.priority === "high"
        ? "1"
        : ticket.priority === "medium"
        ? "2"
        : "3",
    caller_id: ticket.user_name,
    state:
      ticket.status === "resolved"
        ? "6"
        : ticket.status === "in_progress"
        ? "2"
        : "1",
    assignment_group: ticket.suggested_team || "IT Support",
  };

  const response = await fetch(`${instanceUrl}/api/now/table/incident`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(incidentData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ServiceNow API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as ServiceNowIncidentResponse;
  return data.result;
}

async function refreshAccessToken(
  refreshToken: string,
  instanceUrl: string,
  clientId: string,
  clientSecret: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
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

  return await response.json();
}

// POST /api/servicenow/sync-tickets
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

    // Get ServiceNow OAuth credentials
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

    // Fetch all tickets that don't have a ServiceNow incident ID
    const tickets = await TicketModel.find({
      $or: [
        { "external_ids.servicenow": { $exists: false } },
        { "external_ids.servicenow": null },
      ],
    }).limit(50); // Limit to 50 tickets per sync to avoid timeouts

    if (tickets.length === 0) {
      return NextResponse.json(
        {
          success: true,
          synced: 0,
          message: "All tickets are already synced to ServiceNow",
        },
        { headers: corsHeaders }
      );
    }

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Sync each ticket to ServiceNow
    for (const ticket of tickets) {
      try {
        const incident = await createServiceNowIncident(
          accessToken,
          instanceUrl,
          ticket
        );

        // Update ticket with ServiceNow incident ID
        await TicketModel.findByIdAndUpdate(ticket._id, {
          $set: {
            "external_ids.servicenow": incident.number,
          },
        });

        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Ticket ${ticket.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        console.error(`Failed to sync ticket ${ticket.id}:`, error);
      }
    }

    // Log the sync operation
    appendLog({
      provider: "servicenow",
      action: "tickets.sync.completed",
      actor: "admin",
      details: {
        synced: results.synced,
        failed: results.failed,
        total: tickets.length,
        errors:
          results.errors.length > 0 ? results.errors.slice(0, 3) : undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        synced: results.synced,
        failed: results.failed,
        total: tickets.length,
        errors: results.errors.length > 0 ? results.errors : undefined,
        message: `Successfully synced ${results.synced} out of ${tickets.length} ticket(s)`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("ServiceNow sync tickets error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to sync tickets",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
