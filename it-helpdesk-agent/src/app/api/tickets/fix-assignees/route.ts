import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { TicketModel } from "@/lib/models/ticket";

// One-time script to fix assignees for access request tickets
// This endpoint updates existing access request tickets to have the assignee field populated
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Find all access request tickets without assignee
    const tickets = await TicketModel.find({
      ticket_type: "access_request",
      $or: [{ assignee: { $exists: false } }, { assignee: null }],
    });

    const updates = [];

    for (const ticket of tickets) {
      // Try to extract manager name from collected_details
      const managerName = ticket.collected_details?.manager_name;

      if (managerName) {
        await TicketModel.updateOne(
          { _id: ticket._id },
          { $set: { assignee: managerName } }
        );
        updates.push({
          ticketId: ticket.id,
          assignee: managerName,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} access request tickets with assignee`,
      updates,
    });
  } catch (error) {
    console.error("Error fixing assignees:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fix assignees",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
