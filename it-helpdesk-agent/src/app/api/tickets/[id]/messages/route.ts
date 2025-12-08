import { NextRequest, NextResponse } from "next/server";
import { getTicketById } from "@/lib/ticket-store";
import {
  createTicketMessage,
  getTicketMessages,
} from "@/lib/ticket-message-store";
import {
  CreateTicketMessageRequest,
  isValidAuthorType,
} from "@/lib/ticket-message-types";

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

// GET /api/tickets/[id]/messages - Get all messages for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verify ticket exists
    const ticket = await getTicketById(id);
    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: `Ticket with ID '${id}' not found`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get all messages for this ticket
    const messages = await getTicketMessages(id);

    return NextResponse.json(
      {
        success: true,
        data: messages,
        total: messages.length,
        message: `Retrieved ${messages.length} messages for ticket ${id}`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching ticket messages:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        total: 0,
        message: "Failed to fetch ticket messages",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/tickets/[id]/messages - Create a new message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verify ticket exists
    const ticket = await getTicketById(id);
    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: `Ticket with ID '${id}' not found`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.body || body.body.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Message body is required",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body.author_type || !isValidAuthorType(body.author_type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid author_type. Must be 'user', 'agent', 'system', or 'ai'",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const messageData: CreateTicketMessageRequest = {
      body: body.body.trim(),
      author_type: body.author_type,
      author_name: body.author_name,
      is_internal_note: body.is_internal_note || false,
    };

    const newMessage = await createTicketMessage(id, messageData);

    return NextResponse.json(
      {
        success: true,
        data: newMessage,
        message: `Message added to ticket ${id}`,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error creating ticket message:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create ticket message",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
