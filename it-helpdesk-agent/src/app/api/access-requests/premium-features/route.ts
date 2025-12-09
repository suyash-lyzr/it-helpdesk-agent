import { NextRequest, NextResponse } from "next/server";

// Enable CORS
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

// POST /api/access-requests/premium-features - Submit a request for premium feature access
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feature, organization, email, message } = body;

    // Validate required fields
    if (!email || !email.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create access request record
    const accessRequest = {
      id: `ACCESS-${Date.now()}`,
      feature: feature || "Unknown Feature",
      organization: organization?.trim() || null,
      email: email.trim(),
      message: message?.trim() || null,
      requestedAt: new Date().toISOString(),
      status: "pending",
    };

    // Log the request (in production, this would be stored in a database)
    console.log("=== PREMIUM FEATURE ACCESS REQUEST ===");
    console.log(JSON.stringify(accessRequest, null, 2));
    console.log("======================================");

    // In a production environment, you would:
    // 1. Store this in a database
    // 2. Send notification emails to sales/support team
    // 3. Trigger a CRM workflow
    // 4. Add to a queue for follow-up

    // For now, we'll just return success
    return NextResponse.json(
      {
        success: true,
        data: accessRequest,
        message:
          "Your request has been submitted successfully. We'll contact you soon!",
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error processing premium feature access request:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit request. Please try again later.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
