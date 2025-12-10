import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { IntegrationOAuthModel } from "@/lib/models/integration";
import { encrypt } from "@/lib/encryption";
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

// POST /api/integrations/servicenow/save
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instance, clientId, clientSecret, grantType, redirectUri } = body;

    // Validation
    if (!instance || !clientId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Instance URL and Client ID are required",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate instance URL format
    try {
      const instanceUrl = new URL(instance);
      if (instanceUrl.protocol !== "https:") {
        return NextResponse.json(
          {
            ok: false,
            message: "Instance URL must use HTTPS",
          },
          { status: 400, headers: corsHeaders }
        );
      }
      if (!instanceUrl.hostname.includes(".service-now.com")) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Instance URL must be a valid ServiceNow instance (contain .service-now.com)",
          },
          { status: 400, headers: corsHeaders }
        );
      }
    } catch (urlError) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid instance URL format",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate client secret based on grant type
    if (grantType === "client_credentials" && !clientSecret) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Client Secret is required for Client Credentials grant type",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Optionally ping the instance to confirm it's reachable
    try {
      const testUrl = `${instance}/api/now/table/incident?sysparm_limit=1`;
      const testResponse = await fetch(testUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      // We don't require auth for this check, just that the instance is reachable
      if (!testResponse.ok && testResponse.status !== 401) {
        // 401 is expected without auth, but other errors might indicate issues
        console.warn(
          `Instance reachability check returned ${testResponse.status}`
        );
      }
    } catch (reachError) {
      // Log but don't fail - network issues might be temporary
      console.warn("Could not verify instance reachability:", reachError);
    }

    // Connect to database
    await connectToDatabase();

    // Encrypt client secret if provided
    let encryptedClientSecret: string | undefined;
    if (clientSecret) {
      try {
        encryptedClientSecret = encrypt(clientSecret);
      } catch (encryptError) {
        console.error("Encryption error:", encryptError);
        return NextResponse.json(
          {
            ok: false,
            message: "Failed to encrypt client secret",
          },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Save credentials
    await IntegrationOAuthModel.findOneAndUpdate(
      { provider: "servicenow" },
      {
        provider: "servicenow",
        instanceUrl: instance,
        clientId,
        encryptedClientSecret,
        grantType: grantType || "authorization_code",
        redirectUri:
          redirectUri ||
          `${
            process.env.BASE_URL || "http://localhost:3000"
          }/oauth/callback/servicenow`,
        savedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Log the save action
    appendLog({
      provider: "servicenow",
      action: "credentials.saved",
      actor: "admin",
      details: {
        instance,
        grantType: grantType || "authorization_code",
        savedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        saved: true,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error saving ServiceNow credentials:", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to save credentials",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
