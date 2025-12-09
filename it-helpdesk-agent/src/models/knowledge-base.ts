import mongoose, { Schema, Document, Types } from "mongoose";

export type FileType = "pdf" | "docx" | "txt";

export interface IKnowledgeBaseDocument extends Document {
  _id: Types.ObjectId;
  lyzrUserId: string;
  title: string;
  ragId?: string;
  fileName: string;
  originalFileName: string;
  fileType: FileType;
  fileSize: number;
  status: "processing" | "active" | "failed" | "deleted";
  documentCount?: number;
  processingError?: string;
  tags?: string[];
  description?: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeBaseSchema: Schema<IKnowledgeBaseDocument> =
  new Schema<IKnowledgeBaseDocument>(
    {
      lyzrUserId: {
        type: String,
        required: [true, "Lyzr user ID is required"],
        index: true,
      },
      title: {
        type: String,
        required: [true, "Knowledge base title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"],
      },
      ragId: {
        type: String,
        trim: true,
      },
      fileName: {
        type: String,
        required: [true, "File name is required"],
        trim: true,
        maxlength: [255, "File name cannot exceed 255 characters"],
      },
      originalFileName: {
        type: String,
        required: [true, "Original file name is required"],
        trim: true,
        maxlength: [255, "Original file name cannot exceed 255 characters"],
      },
      fileType: {
        type: String,
        enum: ["pdf", "docx", "txt"],
        required: [true, "File type is required"],
      },
      fileSize: {
        type: Number,
        required: [true, "File size is required"],
        min: [0, "File size cannot be negative"],
      },
      status: {
        type: String,
        enum: ["processing", "active", "failed", "deleted"],
        default: "processing",
      },
      documentCount: {
        type: Number,
        min: [0, "Document count cannot be negative"],
      },
      processingError: {
        type: String,
        trim: true,
        maxlength: [1000, "Processing error cannot exceed 1000 characters"],
      },
      tags: [
        {
          type: String,
          trim: true,
          maxlength: [50, "Tag cannot exceed 50 characters"],
        },
      ],
      description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"],
      },
      schemaVersion: {
        type: Number,
        default: 1,
      },
    },
    {
      timestamps: true,
    }
  );

KnowledgeBaseSchema.index({ lyzrUserId: 1, status: 1 });
KnowledgeBaseSchema.index({ lyzrUserId: 1, ragId: 1 });

if (mongoose.models.KnowledgeBase) {
  delete mongoose.models.KnowledgeBase;
}

const KnowledgeBase = mongoose.model<IKnowledgeBaseDocument>(
  "KnowledgeBase",
  KnowledgeBaseSchema
);

export default KnowledgeBase;
