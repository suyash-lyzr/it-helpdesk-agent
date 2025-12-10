import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/user";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const lyzrUserId = request.cookies.get("user_id")?.value;
    if (!lyzrUserId) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ lyzrUserId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        systemInstructions:
          user.knowledgeBase?.systemInstructions ||
          "You are a helpful IT support assistant. Provide accurate, actionable troubleshooting steps and follow IT service guidelines.",
      },
    });
  } catch (error) {
    console.error("Error fetching AI config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const lyzrUserId = request.cookies.get("user_id")?.value;
    if (!lyzrUserId) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ lyzrUserId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { systemInstructions } = await request.json();

    if (!systemInstructions) {
      return NextResponse.json(
        { success: false, error: "System instructions are required" },
        { status: 400 }
      );
    }

    // Update user's knowledge base config
    await User.findByIdAndUpdate(user._id, {
      "knowledgeBase.systemInstructions": systemInstructions,
    });

    return NextResponse.json({
      success: true,
      message: "Configuration saved successfully",
    });
  } catch (error) {
    console.error("Error saving AI config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}
