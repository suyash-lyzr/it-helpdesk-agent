import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createOrUpdateUserAndAgents } from "@/lib/lyzr-services";

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

    // Sync user, create/update tools and agents in their Lyzr account
    await createOrUpdateUserAndAgents(
      { id: user.id, email, name: displayName },
      lyzrApiKey
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user authentication" },
      { status: 500 }
    );
  }
}
