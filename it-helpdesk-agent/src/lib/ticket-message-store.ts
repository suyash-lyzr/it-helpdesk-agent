// Ticket message store for managing conversation history

import { connectToDatabase } from "./db";
import { TicketMessageModel } from "./models/ticket-message";
import { updateTicket } from "./ticket-store";
import {
  TicketMessage,
  CreateTicketMessageRequest,
  MessageAuthorType,
} from "./ticket-message-types";

// Generate a unique message ID
function generateMessageId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MSG-${timestamp}-${random}`;
}

// Create a new ticket message
export async function createTicketMessage(
  ticketId: string,
  data: CreateTicketMessageRequest
): Promise<TicketMessage> {
  await connectToDatabase();
  const now = new Date();

  const doc = await TicketMessageModel.create({
    id: generateMessageId(),
    ticket_id: ticketId,
    author_type: data.author_type,
    author_name: data.author_name,
    body: data.body,
    is_internal_note: data.is_internal_note || false,
    created_at: now,
  });

  // If this is the first agent response (not internal note), update first_response_at on the ticket
  if (data.author_type === "agent" && !data.is_internal_note) {
    const existingMessages = await TicketMessageModel.find({
      ticket_id: ticketId,
      author_type: "agent",
      is_internal_note: false,
    }).countDocuments();

    // If this is the first agent message (count = 1, because we just created it)
    if (existingMessages === 1) {
      await updateTicket(ticketId, {
        first_response_at: now.toISOString(),
      });
    }
  }

  const message = doc.toObject();
  return {
    id: message.id,
    ticket_id: message.ticket_id,
    author_type: message.author_type,
    author_name: message.author_name,
    body: message.body,
    is_internal_note: message.is_internal_note,
    created_at: message.created_at.toISOString(),
  };
}

// Get all messages for a ticket
export async function getTicketMessages(
  ticketId: string
): Promise<TicketMessage[]> {
  await connectToDatabase();

  const docs = await TicketMessageModel.find({ ticket_id: ticketId })
    .sort({ created_at: 1 })
    .lean();

  return docs.map((doc) => ({
    id: doc.id,
    ticket_id: doc.ticket_id,
    author_type: doc.author_type,
    author_name: doc.author_name,
    body: doc.body,
    is_internal_note: doc.is_internal_note,
    created_at:
      doc.created_at instanceof Date
        ? doc.created_at.toISOString()
        : doc.created_at,
  }));
}

// Get message count for a ticket
export async function getTicketMessageCount(ticketId: string): Promise<number> {
  await connectToDatabase();
  return await TicketMessageModel.countDocuments({ ticket_id: ticketId });
}

// Bulk create messages from a conversation (used when creating tickets with full chat history)
export async function createMessagesFromConversation(
  ticketId: string,
  conversation: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: string;
  }>
): Promise<TicketMessage[]> {
  await connectToDatabase();

  const messages: TicketMessage[] = [];

  for (const msg of conversation) {
    // Map role to author_type
    let authorType: MessageAuthorType;
    let authorName: string | undefined;

    switch (msg.role) {
      case "user":
        authorType = "user";
        authorName = "User";
        break;
      case "assistant":
        authorType = "ai";
        authorName = "AI Assistant";
        break;
      case "system":
        authorType = "system";
        authorName = "System";
        break;
      default:
        authorType = "user";
    }

    const messageDoc = await TicketMessageModel.create({
      id: generateMessageId(),
      ticket_id: ticketId,
      author_type: authorType,
      author_name: authorName,
      body: msg.content,
      is_internal_note: false,
      created_at: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    });

    const message = messageDoc.toObject();
    messages.push({
      id: message.id,
      ticket_id: message.ticket_id,
      author_type: message.author_type,
      author_name: message.author_name,
      body: message.body,
      is_internal_note: message.is_internal_note,
      created_at:
        message.created_at instanceof Date
          ? message.created_at.toISOString()
          : message.created_at,
    });
  }

  return messages;
}
