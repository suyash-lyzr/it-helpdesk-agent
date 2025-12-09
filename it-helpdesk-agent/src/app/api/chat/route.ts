import { NextRequest, NextResponse } from "next/server";
import { LYZR_CONFIG, streamChatWithAgent } from "@/lib/lyzr-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, session_id, user_id } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const responseStream = await streamChatWithAgent(
      LYZR_CONFIG.apiKey,
      LYZR_CONFIG.agentId,
      message,
      user_id || LYZR_CONFIG.defaultUserId,
      {},
      session_id
    );

    // Stream SSE/text from Lyzr straight through to the client
    return new Response(responseStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
