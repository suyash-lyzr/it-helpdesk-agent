import { NextRequest, NextResponse } from "next/server";
import { seedDemoTickets, hasDemoData } from "@/lib/seed-demo-data";
import { isDemoAccount } from "@/lib/demo-utils";

// Enable CORS for external API access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * GET /api/admin/seed-demo-data - Check if demo data exists
 */
export async function GET(request: NextRequest) {
  try {
    const lyzrUserId = request.cookies.get("user_id")?.value;
    const userEmail = request.headers.get("x-user-email") || null;

    if (!lyzrUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID not found. Please log in.",
        },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if this is a demo account
    if (!isDemoAccount(userEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Demo data seeding is only available for demo accounts.",
        },
        { status: 403, headers: corsHeaders }
      );
    }

    const hasData = await hasDemoData(lyzrUserId);

    return NextResponse.json(
      {
        success: true,
        hasData,
        message: hasData
          ? "Demo data already exists"
          : "No demo data found. You can seed demo data.",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error checking demo data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check demo data status",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/admin/seed-demo-data - Seed demo tickets for demo accounts
 */
export async function POST(request: NextRequest) {
  try {
    const lyzrUserId = request.cookies.get("user_id")?.value;
    const userEmail = request.headers.get("x-user-email") || null;

    console.log("=== SEED DEMO DATA REQUEST ===");
    console.log("User ID:", lyzrUserId);
    console.log("User Email:", userEmail);

    if (!lyzrUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID not found. Please log in.",
        },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if this is a demo account
    if (!isDemoAccount(userEmail)) {
      console.log("❌ Not a demo account, seeding denied");
      return NextResponse.json(
        {
          success: false,
          message: "Demo data seeding is only available for demo accounts.",
        },
        { status: 403, headers: corsHeaders }
      );
    }

    console.log("✓ Demo account verified, proceeding with seed");

    // Seed demo tickets
    console.log("🌱 Seeding demo tickets...");
    const tickets = await seedDemoTickets(lyzrUserId);

    console.log(`✅ Successfully created ${tickets.length} demo tickets`);
    console.log("=== END SEED DEMO DATA ===");

    return NextResponse.json(
      {
        success: true,
        message: `Successfully created ${tickets.length} demo tickets`,
        data: {
          count: tickets.length,
          ticketIds: tickets.map((t) => t.id),
        },
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.log("=== END SEED DEMO DATA (ERROR) ===");

    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed demo data",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
