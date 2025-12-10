import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/user";
import KnowledgeBase from "@/models/knowledge-base";

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

    // Fetch all knowledge base documents for this user
    const documents = await KnowledgeBase.find({
      lyzrUserId,
      status: { $ne: "deleted" },
    }).sort({ createdAt: -1 });

    // Transform to match frontend format
    const transformedDocuments = documents.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      category: doc.tags || ["Uncategorized"],
      source: "Manual" as const,
      size: Math.round(doc.fileSize / 1024), // Convert to KB
      pages: undefined,
      status:
        doc.status === "processing"
          ? "Processing"
          : doc.status === "active"
          ? "Processed"
          : "Failed",
      processedAt: doc.status === "active" ? doc.updatedAt.toISOString() : null,
      version: doc.schemaVersion,
      error: doc.processingError,
      chunks: doc.documentCount,
      embeddings: doc.documentCount ? 1536 : undefined,
      lastEmbedTime:
        doc.status === "active" ? doc.updatedAt.toISOString() : undefined,
    }));

    // Calculate KPIs
    const totalDocuments = documents.length;
    const processedDocuments = documents.filter(
      (d) => d.status === "active"
    ).length;
    const processedPercentage =
      totalDocuments > 0
        ? Math.round((processedDocuments / totalDocuments) * 100)
        : 0;

    const lastIngestion = documents.find((d) => d.status === "active");
    const lastIngestionTime = lastIngestion
      ? new Date(lastIngestion.updatedAt)
      : null;

    // Coverage score placeholder (not in use currently)
    const coverageScore = 0;

    return NextResponse.json({
      success: true,
      documents: transformedDocuments,
      kpis: {
        totalDocuments,
        processedDocuments,
        processedPercentage,
        lastIngestionTime: lastIngestionTime
          ? lastIngestionTime.toISOString()
          : null,
        coverageScore,
      },
    });
  } catch (error) {
    console.error("Error fetching knowledge base documents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const lyzrUserId = request.cookies.get("user_id")?.value;
    if (!lyzrUserId) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("id");

    if (!docId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Find and mark as deleted
    const doc = await KnowledgeBase.findOneAndUpdate(
      { _id: docId, lyzrUserId },
      { status: "deleted" },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting knowledge base document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
