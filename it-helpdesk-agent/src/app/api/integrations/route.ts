import { NextResponse } from "next/server";
import { getIntegrations } from "@/lib/integrations-store";
import { connectToDatabase } from "@/lib/db";
import { IntegrationOAuthModel } from "@/lib/models/integration";

// Basic CORS headers to match existing ticket APIs (demo-friendly)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET /api/integrations — list all integrations and their status
export async function GET() {
  try {
    const integrations = getIntegrations();

    // Check MongoDB for OAuth connections
    try {
      await connectToDatabase();
      const oauthIntegrations = await IntegrationOAuthModel.find({});

      // Merge OAuth status with file-based integrations
      const mergedIntegrations = integrations.map((integration) => {
        const oauthData = oauthIntegrations.find(
          (oauth) => oauth.provider === integration.meta.id
        );

        if (oauthData && oauthData.connected) {
          return {
            ...integration,
            status: "connected" as const,
            mode: "real" as const,
            connectedAt: oauthData.connectedAt?.toISOString(),
            lastTestAt: oauthData.lastTestAt?.toISOString(),
            maskedToken: oauthData.accessToken
              ? `****${oauthData.accessToken.slice(-4)}`
              : undefined,
          };
        }

        return integration;
      });

      return NextResponse.json(
        {
          success: true,
          data: mergedIntegrations,
          message: "Integrations retrieved successfully",
        },
        { headers: corsHeaders }
      );
    } catch (dbError) {
      // If database check fails, return file-based data
      console.warn("Failed to check OAuth status from database:", dbError);
      return NextResponse.json(
        {
          success: true,
          data: integrations,
          message: "Integrations retrieved successfully",
        },
        { headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        message: "Failed to fetch integrations",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
