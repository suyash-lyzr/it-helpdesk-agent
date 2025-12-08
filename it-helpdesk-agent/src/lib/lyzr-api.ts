// Lyzr Agent API Configuration
export const LYZR_CONFIG = {
  endpoint: "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
  apiKey: "sk-default-eE6EHcdIhXl61H4mK4YKZFqISTGrruf1",
  agentId: "692fd2f06b01be7c2f9f8b73",
  defaultUserId: "suyash@lyzr.ai",
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface LyzrChatRequest {
  user_id: string;
  agent_id: string;
  session_id: string;
  message: string;
}

export interface LyzrChatResponse {
  response?: string;
  message?: string;
  error?: string;
}

// Generate a unique session ID
export function generateSessionId(agentId: string): string {
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${agentId}-${randomPart}`;
}

// Generate a unique message ID
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

