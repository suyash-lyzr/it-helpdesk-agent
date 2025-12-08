// Ticket message types for conversation storage

export type MessageAuthorType = "user" | "agent" | "system" | "ai";

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_type: MessageAuthorType;
  author_name?: string;
  body: string;
  is_internal_note: boolean;
  created_at: string;
}

export interface CreateTicketMessageRequest {
  body: string;
  author_type: MessageAuthorType;
  author_name?: string;
  is_internal_note?: boolean;
}

export interface TicketMessageResponse {
  success: boolean;
  data: TicketMessage;
  message?: string;
}

export interface TicketMessagesListResponse {
  success: boolean;
  data: TicketMessage[];
  total: number;
  message?: string;
}

// Helper to validate author type
export function isValidAuthorType(type: string): type is MessageAuthorType {
  return ["user", "agent", "system", "ai"].includes(type);
}
