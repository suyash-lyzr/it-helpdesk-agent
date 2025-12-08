import { NextRequest, NextResponse } from "next/server";
import {
  createTicket,
  getTickets,
  getTicketCounts,
  searchTickets,
} from "@/lib/ticket-store";
import { createMessagesFromConversation } from "@/lib/ticket-message-store";
import {
  CreateTicketRequest,
  TicketQueryParams,
  isValidTicketType,
  isValidPriority,
  isValidStatus,
  isValidTeam,
} from "@/lib/ticket-types";

// Enable CORS for external API access (Lyzr Studio)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET /api/tickets - List all tickets with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check if it's a search query
    const query = searchParams.get("q") || searchParams.get("search");
    if (query) {
      const results = await searchTickets(query);
      return NextResponse.json(
        {
          success: true,
          data: results,
          total: results.length,
          message: `Found ${results.length} tickets matching "${query}"`,
        },
        { headers: corsHeaders }
      );
    }

    // Check if requesting counts only
    const countsOnly = searchParams.get("counts_only") === "true";
    if (countsOnly) {
      const counts = await getTicketCounts();
      return NextResponse.json(
        {
          success: true,
          data: counts,
          message: "Ticket counts retrieved successfully",
        },
        { headers: corsHeaders }
      );
    }

    // Build query parameters
    const params: TicketQueryParams = {};

    const status = searchParams.get("status");
    if (status && isValidStatus(status)) {
      params.status = status;
    }

    const priority = searchParams.get("priority");
    if (priority && isValidPriority(priority)) {
      params.priority = priority;
    }

    const ticketType = searchParams.get("ticket_type");
    if (ticketType && isValidTicketType(ticketType)) {
      params.ticket_type = ticketType;
    }

    const suggestedTeam = searchParams.get("suggested_team");
    if (suggestedTeam && isValidTeam(suggestedTeam)) {
      params.suggested_team = suggestedTeam;
    }

    const limit = searchParams.get("limit");
    if (limit) {
      params.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get("offset");
    if (offset) {
      params.offset = parseInt(offset, 10);
    }

    const { tickets, total } = await getTickets(params);

    return NextResponse.json(
      {
        success: true,
        data: tickets,
        total,
        message: `Retrieved ${tickets.length} of ${total} tickets`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        total: 0,
        message: "Failed to fetch tickets",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    console.log("=== TICKET CREATION REQUEST ===");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Handle Ticket Generator Agent format (with ticket_ready field)
    const ticketData: CreateTicketRequest = {
      ticket_type: body.ticket_type,
      title: body.title,
      description: body.description,
      user_name: body.user_name,
      app_or_system: body.app_or_system,
      priority: body.priority,
      collected_details: body.collected_details,
      suggested_team: body.suggested_team,
      status: body.status || "new",
    };

    // Validate required fields
    if (!ticketData.ticket_type || !isValidTicketType(ticketData.ticket_type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or missing ticket_type. Must be 'incident', 'access_request', or 'request'",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!ticketData.title || ticketData.title.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!ticketData.description || ticketData.description.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Description is required",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate optional fields if provided
    if (ticketData.priority && !isValidPriority(ticketData.priority)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid priority. Must be 'low', 'medium', or 'high'",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (ticketData.status && !isValidStatus(ticketData.status)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid status. Must be 'new', 'open', 'in_progress', 'resolved', or 'closed'",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (ticketData.suggested_team && !isValidTeam(ticketData.suggested_team)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid suggested_team. Must be 'Network', 'Endpoint Support', 'Application Support', 'IAM', 'Security', or 'DevOps'",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const newTicket = await createTicket(ticketData);
    console.log("✅ Ticket created successfully:", newTicket.id);

    // If conversation history is provided, store it as messages
    if (body.conversation && Array.isArray(body.conversation)) {
      console.log(
        `📝 Storing conversation history (${body.conversation.length} messages)`
      );
      try {
        await createMessagesFromConversation(newTicket.id, body.conversation);
        console.log("✅ Conversation history stored successfully");
      } catch (convError) {
        console.error("⚠️ Error storing conversation history:", convError);
        // Don't fail the ticket creation if conversation storage fails
      }
    }

    console.log("=== END TICKET CREATION ===");

    return NextResponse.json(
      {
        success: true,
        data: newTicket,
        message: `Ticket ${newTicket.id} created successfully`,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ Error creating ticket:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.log("=== END TICKET CREATION (ERROR) ===");
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create ticket. Please check the request format.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
