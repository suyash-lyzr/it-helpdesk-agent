import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/user";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { user, lyzrApiKey } = body as {
      user?: { id?: string; email?: string | null; name?: string | null };
      lyzrApiKey?: string;
    };

    if (!user?.id || !user.email || !lyzrApiKey) {
      return NextResponse.json(
        { error: "Missing required user or API key fields" },
        { status: 400 }
      );
    }

    const email = user.email.toLowerCase();
    const displayName =
      user.name ||
      email.split("@")[0].charAt(0).toUpperCase() +
        email.split("@")[0].slice(1);

    const existing = await User.findOne({ lyzrUserId: user.id });

    if (existing) {
      existing.email = email;
      existing.displayName = displayName;
      existing.lyzrApiKey = lyzrApiKey;
      await existing.save();
    } else {
      await User.create({
        lyzrUserId: user.id,
        email,
        displayName,
        lyzrApiKey,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user authentication" },
      { status: 500 }
    );
  }
}
