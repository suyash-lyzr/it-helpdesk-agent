import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { decrypt } from "@/lib/lyzr-services";
import User from "@/models/user";

interface DecodedToken {
  id?: string;
  email?: string;
  name?: string;
  organization_id?: string;
  [key: string]: unknown;
}

// POST /api/auth/token - Exchange Memberstack token for Lyzr credentials
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Decode JWT token to extract user info
    let decodedToken: DecodedToken;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64')
          .toString()
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      decodedToken = JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    // Extract user info from token
    const userId = decodedToken.id;
    const userEmail = decodedToken.email || null;
    const userName = decodedToken.name || null;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in token" },
        { status: 400 }
      );
    }

    // Check if user exists in database
    const existingUser = await User.findOne({ lyzrUserId: userId });

    if (existingUser && existingUser.lyzrApiKey) {
      // User exists, return their Lyzr API key
      const decryptedApiKey = decrypt(existingUser.lyzrApiKey);

      return NextResponse.json({
        user: {
          id: userId,
          email: existingUser.email || userEmail,
          name: existingUser.name || userName,
        },
        lyzrApiKey: decryptedApiKey,
      });
    }

    // User doesn't exist or doesn't have Lyzr API key
    // This means they need to authenticate with Lyzr SDK first
    // For now, return an error indicating they need to use the SDK
    return NextResponse.json(
      {
        error: "User not found. Please authenticate with Lyzr SDK first.",
        requiresSdkAuth: true,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      { error: "Failed to process token" },
      { status: 500 }
    );
  }
}

