import { NextRequest, NextResponse } from "next/server";
import { getTicketById, updateTicket, deleteTicket } from "@/lib/ticket-store";
import {
  UpdateTicketRequest,
  isValidTicketType,
  isValidPriority,
  isValidStatus,
  isValidTeam,
} from "@/lib/ticket-types";

// Enable CORS for external API access (Lyzr Studio)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET /api/tickets/[id] - Get a single ticket by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    return NextResponse.json(
      {
        success: true,
        data: ticket,
        message: "Ticket retrieved successfully",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch ticket",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT /api/tickets/[id] - Update a ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if ticket exists
    const existingTicket = await getTicketById(id);
    if (!existingTicket) {
      return NextResponse.json(
        {
          success: false,
          message: `Ticket with ID '${id}' not found`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Build update data
    const updateData: UpdateTicketRequest = {};

    if (body.ticket_type !== undefined) {
      if (!isValidTicketType(body.ticket_type)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid ticket_type. Must be 'incident', 'access_request', or 'request'",
          },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.ticket_type = body.ticket_type;
    }

    if (body.title !== undefined) {
      if (body.title.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            message: "Title cannot be empty",
          },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.title = body.title;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.user_name !== undefined) {
      updateData.user_name = body.user_name;
    }

    if (body.app_or_system !== undefined) {
      updateData.app_or_system = body.app_or_system;
    }

    if (body.priority !== undefined) {
      if (!isValidPriority(body.priority)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid priority. Must be 'low', 'medium', or 'high'",
          },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.priority = body.priority;
    }

    if (body.collected_details !== undefined) {
      updateData.collected_details = body.collected_details;
    }

    if (body.suggested_team !== undefined) {
      if (!isValidTeam(body.suggested_team)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid suggested_team. Must be 'Network', 'Endpoint Support', 'Application Support', 'IAM', 'Security', or 'DevOps'",
          },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.suggested_team = body.suggested_team;
    }

    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid status. Must be 'new', 'open', 'in_progress', 'resolved', or 'closed'",
          },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.status = body.status;
    }

    if (body.resolved_at !== undefined) {
      const resolvedDate = new Date(body.resolved_at);
      if (Number.isNaN(resolvedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid resolved_at. Must be a valid date string.",
          },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.resolved_at = resolvedDate.toISOString();
    } else if (
      updateData.status === "resolved" &&
      existingTicket.resolved_at === undefined
    ) {
      // Auto-set resolved_at when marking resolved and no timestamp provided
      updateData.resolved_at = new Date().toISOString();
    }

    if (body.first_response_at !== undefined) {
      const firstResponseDate = new Date(body.first_response_at);
      if (Number.isNaN(firstResponseDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid first_response_at. Must be a valid date string.",
          },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.first_response_at = firstResponseDate.toISOString();
    }

    if (body.assignee !== undefined) {
      updateData.assignee = body.assignee;
    }

    if (body.lifecycle_stage !== undefined) {
      const lifecycleValues = [
        "new",
        "triage",
        "in_progress",
        "waiting_for_user",
        "resolved",
        "closed",
      ] as const;
      if (!lifecycleValues.includes(body.lifecycle_stage)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid lifecycle_stage. Must be one of: new, triage, in_progress, waiting_for_user, resolved, closed",
          },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.lifecycle_stage = body.lifecycle_stage;
    } else if (updateData.status === "resolved") {
      updateData.lifecycle_stage = "resolved";
    }

    const updatedTicket = await updateTicket(id, updateData);

    return NextResponse.json(
      {
        success: true,
        data: updatedTicket,
        message: `Ticket ${id} updated successfully`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update ticket",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE /api/tickets/[id] - Delete a ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const deleted = await deleteTicket(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: `Ticket with ID '${id}' not found`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Ticket ${id} deleted successfully`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete ticket",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
