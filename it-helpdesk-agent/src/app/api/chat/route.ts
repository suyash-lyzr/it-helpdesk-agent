import { NextRequest, NextResponse } from "next/server";
import { LYZR_CONFIG, streamChatWithAgent } from "@/lib/lyzr-api";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/user";
import { decrypt } from "@/lib/lyzr-services";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { message, session_id, user_id } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Default to app-level key/agent, but prefer per-user agents if available
    let apiKey = LYZR_CONFIG.apiKey;
    let agentId = LYZR_CONFIG.agentId;
    let effectiveUserId = user_id || LYZR_CONFIG.defaultUserId;

    try {
      const cookieUserId = request.cookies.get("user_id")?.value;
      const lyzrUserId = cookieUserId || user_id;

      if (lyzrUserId) {
        const user = await User.findOne({ lyzrUserId });
        if (user && user.orchestratorAgent?.agentId) {
          apiKey = decrypt(user.lyzrApiKey);
          agentId = user.orchestratorAgent.agentId;
          effectiveUserId = user.email || lyzrUserId;
        }
      }
    } catch (lookupError) {
      console.error(
        "Falling back to default Lyzr config; user-specific lookup failed:",
        lookupError
      );
    }

    const responseStream = await streamChatWithAgent(
      apiKey,
      agentId,
      message,
      effectiveUserId,
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
