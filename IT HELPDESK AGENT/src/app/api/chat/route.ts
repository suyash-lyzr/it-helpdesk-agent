import { NextRequest, NextResponse } from "next/server";
import { LYZR_CONFIG } from "@/lib/lyzr-api";

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

    const response = await fetch(LYZR_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LYZR_CONFIG.apiKey,
      },
      body: JSON.stringify({
        user_id: user_id || LYZR_CONFIG.defaultUserId,
        agent_id: LYZR_CONFIG.agentId,
        session_id: session_id,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lyzr API error:", errorText);
      return NextResponse.json(
        { error: "Failed to get response from AI agent" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

