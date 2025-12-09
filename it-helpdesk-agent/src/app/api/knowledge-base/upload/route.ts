import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/user";
import KnowledgeBase from "@/models/knowledge-base";
import { decrypt } from "@/lib/lyzr-services";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const LYZR_RAG_BASE_URL = "https://rag-prod.studio.lyzr.ai";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size must be less than ${
            MAX_FILE_SIZE / 1024 / 1024
          } MB`,
        },
        { status: 400 }
      );
    }

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

    if (!user.knowledgeBase?.ragId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Knowledge base not initialized for this user. Please log out and log in again.",
        },
        { status: 400 }
      );
    }

    const apiKey = decrypt(user.lyzrApiKey);
    const ragId = user.knowledgeBase.ragId;
    const ragBaseUrl = user.knowledgeBase.baseUrl || LYZR_RAG_BASE_URL;

    // Determine file type and parser
    const fileType = file.type;
    let fileTypeEnum: "pdf" | "docx" | "txt";
    let dataParser: string;

    if (fileType === "application/pdf") {
      fileTypeEnum = "pdf";
      dataParser = "pypdf";
    } else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      fileTypeEnum = "docx";
      dataParser = "docx2txt";
    } else if (fileType === "text/plain") {
      fileTypeEnum = "txt";
      dataParser = "txt_parser";
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Only PDF, DOCX, and TXT files are supported",
        },
        { status: 400 }
      );
    }

    // Create initial KB document record
    const title = file.name.replace(/\.[^/.]+$/, "");
    const kbDoc = await KnowledgeBase.create({
      lyzrUserId,
      title,
      fileName: file.name,
      originalFileName: file.name,
      fileType: fileTypeEnum,
      fileSize: file.size,
      status: "processing",
    });

    try {
      // Train directly using RAG train endpoints (parse + train in one call)
      const trainForm = new FormData();
      trainForm.append("file", file);
      trainForm.append("data_parser", dataParser);
      trainForm.append("extra_info", "{}");

      // Choose correct train endpoint segment based on file type
      const trainSegment =
        fileTypeEnum === "pdf"
          ? "pdf"
          : fileTypeEnum === "docx"
          ? "docx"
          : "txt";

      const trainUrl = `${ragBaseUrl}/v3/train/${trainSegment}/?rag_id=${encodeURIComponent(
        ragId
      )}`;

      const trainResponse = await fetch(trainUrl, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          // Do not set Content-Type; fetch will set multipart boundary
        },
        body: trainForm,
      });

      if (!trainResponse.ok) {
        const errorText = await trainResponse.text();
        console.error(
          "KB train failed:",
          trainResponse.status,
          trainResponse.statusText,
          errorText
        );
        throw new Error(
          `Knowledge base training failed: ${trainResponse.status} ${trainResponse.statusText} - ${errorText}`
        );
      }

      const trainResult = await trainResponse.json().catch(() => null);

      await KnowledgeBase.findByIdAndUpdate(kbDoc._id, {
        status: "active",
        ragId: trainResult?.rag_id ?? ragId,
        documentCount: trainResult?.document_count,
      });

      return NextResponse.json({
        success: true,
        message: "Document uploaded and processed successfully",
        documentId: kbDoc._id.toString(),
      });
    } catch (err) {
      console.error("Lyzr KB processing error:", err);

      await KnowledgeBase.findByIdAndUpdate(kbDoc._id, {
        status: "failed",
        processingError:
          err instanceof Error ? err.message : "Unknown processing error",
      });

      return NextResponse.json(
        {
          success: false,
          error: `Document processing failed: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Knowledge base upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
