import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import FeatureRequest from "@/models/feature-request";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, request: featureRequest } = body;

    if (!email || !featureRequest) {
      return NextResponse.json(
        { error: "Email and request are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const newFeatureRequest = new FeatureRequest({
      email,
      request: featureRequest,
      status: "pending",
    });

    await newFeatureRequest.save();

    return NextResponse.json(
      {
        message: "Feature request submitted successfully",
        id: newFeatureRequest._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving feature request:", error);
    return NextResponse.json(
      { error: "Failed to save feature request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query = status ? { status } : {};
    const featureRequests = await FeatureRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ featureRequests }, { status: 200 });
  } catch (error) {
    console.error("Error fetching feature requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature requests" },
      { status: 500 }
    );
  }
}
