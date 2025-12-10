import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/user";
import KnowledgeBase from "@/models/knowledge-base";

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

    const { docId } = await request.json();

    if (!docId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Find the document
    const doc = await KnowledgeBase.findOne({ _id: docId, lyzrUserId });
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Mark as processing
    await KnowledgeBase.findByIdAndUpdate(docId, {
      status: "processing",
      processingError: undefined,
    });

    // In a real implementation, you would trigger reprocessing here
    // For now, we'll simulate it by immediately marking as active
    setTimeout(async () => {
      await KnowledgeBase.findByIdAndUpdate(docId, {
        status: "active",
        schemaVersion: doc.schemaVersion + 1,
      });
    }, 2000);

    return NextResponse.json({
      success: true,
      message: "Document reprocessing initiated",
    });
  } catch (error) {
    console.error("Error reprocessing document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reprocess document" },
      { status: 500 }
    );
  }
}
