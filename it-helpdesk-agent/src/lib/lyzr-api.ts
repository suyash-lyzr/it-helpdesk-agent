// Lyzr Agent API Configuration
const LYZR_AGENT_BASE_URL = "https://agent-prod.studio.lyzr.ai";

export const LYZR_CONFIG = {
  endpoint: `${LYZR_AGENT_BASE_URL}/v3/inference/stream/`,
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

/**
 * Stream chat with Lyzr Agent (Streaming)
 */
export async function streamChatWithAgent(
  apiKey: string,
  agentId: string,
  message: string,
  userId: string,
  systemPromptVariables: Record<string, unknown> = {},
  sessionId?: string
): Promise<ReadableStream> {
  const finalSessionId =
    sessionId ||
    `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const requestBody = {
    user_id: userId,
    agent_id: agentId,
    session_id: finalSessionId,
    message: message,
    system_prompt_variables: systemPromptVariables,
    filter_variables: {},
    features: [],
  };

  console.log("Streaming chat request:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/inference/stream/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Streaming chat failed:", response.status, errorText);
    throw new Error(
      `Failed to stream chat with agent: ${response.status} ${errorText}`
    );
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  return response.body;
}
