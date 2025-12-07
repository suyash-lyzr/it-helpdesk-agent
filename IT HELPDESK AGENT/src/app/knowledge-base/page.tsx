"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UploadCloud,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  Download,
  RefreshCw,
  Trash2,
  FileCheck,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

// Types
type DocumentStatus = "Uploading" | "Processing" | "Processed" | "Failed";
type DocumentSource =
  | "Manual"
  | "Confluence"
  | "Notion"
  | "SharePoint"
  | "Google Drive";

interface Document {
  id: string;
  title: string;
  category: string[];
  source: DocumentSource;
  size: number;
  pages?: number;
  status: DocumentStatus;
  processedAt: string | null;
  version: number;
  error?: string;
  chunks?: number;
  embeddings?: number;
  lastEmbedTime?: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  document?: string;
  status: "success" | "error" | "info";
  details?: string;
}

interface AIInsight {
  topTopics: string[];
  gaps: string[];
  duplicateWarnings: number;
}

// Mock data
const initialDocuments: Document[] = [
  {
    id: "1",
    title: "VPN Setup Guide",
    category: ["Network", "Security"],
    source: "Manual",
    size: 245,
    pages: 3,
    status: "Processed",
    processedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    version: 1,
    chunks: 12,
    embeddings: 1536,
    lastEmbedTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialAIInsights: AIInsight = {
  topTopics: ["VPN setup", "Password reset", "Onboarding"],
  gaps: ["Outlook troubleshooting guide"],
  duplicateWarnings: 0,
};

const initialAuditLog: AuditLogEntry[] = [
  {
    id: "a1",
    timestamp: "2024-12-08T11:00:00Z",
    action: "Document uploaded",
    document: "VPN Setup Guide",
    status: "success",
  },
  {
    id: "a2",
    timestamp: "2024-12-08T10:45:00Z",
    action: "Embeddings updated",
    document: "Password Reset Procedure",
    status: "success",
  },
  {
    id: "a3",
    timestamp: "2024-12-08T10:30:00Z",
    action: "Document processed",
    document: "Laptop Setup Instructions",
    status: "success",
  },
  {
    id: "a4",
    timestamp: "2024-12-08T10:15:00Z",
    action: "Document upload failed",
    document: "Printer Troubleshooting",
    status: "error",
    details: "Corrupted PDF structure",
  },
  {
    id: "a5",
    timestamp: "2024-12-08T09:00:00Z",
    action: "Bulk reprocess initiated",
    status: "info",
    details: "3 documents reprocessed",
  },
  {
    id: "a6",
    timestamp: "2024-12-08T08:30:00Z",
    action: "Import from Confluence",
    document: "Outlook Configuration Guide",
    status: "success",
  },
];

export default function KnowledgeBasePage() {
  const [documents, setDocuments] =
    React.useState<Document[]>(initialDocuments);
  const [auditLog, setAuditLog] =
    React.useState<AuditLogEntry[]>(initialAuditLog);
  const [aiInsights] = React.useState<AIInsight>(initialAIInsights);
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<DocumentStatus[]>([]);
  const [sourceFilter, setSourceFilter] = React.useState<DocumentSource[]>([]);

  // KPI calculations - simplified
  const totalDocuments = 1;
  const processedDocuments = 1;
  const processedPercentage = 100;
  const lastIngestionTime = "1 day ago";
  const coverageScore = 72; // Mock value

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (
      searchQuery &&
      !doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (
      categoryFilter.length > 0 &&
      !categoryFilter.some((cat) => doc.category.includes(cat))
    ) {
      return false;
    }
    if (statusFilter.length > 0 && !statusFilter.includes(doc.status)) {
      return false;
    }
    if (sourceFilter.length > 0 && !sourceFilter.includes(doc.source)) {
      return false;
    }
    return true;
  });

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  function getStatusBadge(status: DocumentStatus) {
    const variants: Record<
      DocumentStatus,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: React.ReactNode;
        tooltip: string;
      }
    > = {
      Uploading: {
        variant: "secondary",
        icon: <Clock className="h-3 w-3" />,
        tooltip: "File is being uploaded",
      },
      Processing: {
        variant: "secondary",
        icon: <RefreshCw className="h-3 w-3 animate-spin" />,
        tooltip: "Extracting text and building vectors (may take a minute)",
      },
      Processed: {
        variant: "default",
        icon: <CheckCircle2 className="h-3 w-3" />,
        tooltip: "Ready for AI queries",
      },
      Failed: {
        variant: "destructive",
        icon: <XCircle className="h-3 w-3" />,
        tooltip: "Processing failed — click View log",
      },
    };

    const config = variants[status];
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {status}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{config.tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 100MB limit`);
        return;
      }

      const newDoc: Document = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: file.name,
        category: ["Uncategorized"],
        source: "Manual",
        size: Math.round(file.size / 1024),
        status: "Uploading",
        processedAt: null,
        version: 1,
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setAuditLog((prev) => [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          action: "Document uploaded",
          document: file.name,
          status: "success",
        },
        ...prev,
      ]);

      // Simulate upload -> processing -> processed
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === newDoc.id ? { ...d, status: "Processing" } : d
          )
        );
      }, 1000);

      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === newDoc.id
              ? {
                  ...d,
                  status: "Processed",
                  processedAt: new Date().toISOString(),
                  chunks: Math.floor(Math.random() * 20) + 5,
                  embeddings: 1536,
                  lastEmbedTime: new Date().toISOString(),
                }
              : d
          )
        );
        toast.success(`${file.name} processed successfully`);
      }, 3000);
    });
  }

  function handleReprocess(docId: string) {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, status: "Processing", processedAt: null } : d
      )
    );

    toast.success("Reprocessing document...");

    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: "Processed",
                processedAt: new Date().toISOString(),
                version: d.version + 1,
                lastEmbedTime: new Date().toISOString(),
              }
            : d
        )
      );
      setAuditLog((prev) => [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          action: "Document reprocessed",
          document: prev.find((d) => d.document)?.document || "Document",
          status: "success",
        },
        ...prev,
      ]);
      toast.success("Document reprocessed successfully");
    }, 2000);
  }

  function handleDelete(docId: string) {
    const doc = documents.find((d) => d.id === docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setAuditLog((prev) => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: "Document deleted",
        document: doc?.title,
        status: "info",
      },
      ...prev,
    ]);
    toast.success("Document deleted");
  }

  function handleBulkReprocess() {
    if (selectedRows.size === 0) {
      toast.error("No documents selected");
      return;
    }

    selectedRows.forEach((id) => {
      handleReprocess(id);
    });

    setSelectedRows(new Set());
    toast.success(`Reprocessing ${selectedRows.size} document(s)...`);
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex flex-1 flex-col h-full">
          <header className="flex items-center justify-between border-b bg-background px-6 py-4 shrink-0">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Knowledge Base
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage knowledge base documents and AI assistant configuration.
              </p>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-4">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Total documents
                      </p>
                      <p className="text-2xl font-semibold">{totalDocuments}</p>
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Documents processed
                          </p>
                          <p className="text-2xl font-semibold">
                            {processedDocuments}{" "}
                            <span className="text-sm text-muted-foreground">
                              ({processedPercentage}%)
                            </span>
                          </p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  Documents successfully processed and ready for AI queries
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Last ingestion
                          </p>
                          <p className="text-2xl font-semibold">
                            {lastIngestionTime}
                          </p>
                        </div>
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  Time since last document was processed
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Coverage score
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-2xl font-semibold">
                              {coverageScore}
                            </p>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#603BFC] to-[#A94FA1]"
                                style={{ width: `${coverageScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  Estimated coverage of commonly asked help topics (algorithmic
                  estimate)
                </TooltipContent>
              </Tooltip>
            </div>

            <Tabs
              defaultValue="knowledge-base"
              className="flex flex-1 flex-col gap-4"
            >
              <TabsList className="w-fit">
                <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
                <TabsTrigger value="improve-with-ai">
                  Improve with AI
                </TabsTrigger>
                <TabsTrigger value="ai-configuration">
                  AI Configuration
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="knowledge-base"
                className="flex flex-1 flex-col gap-4"
              >
                <div className="flex flex-col gap-4">
                  {/* Upload Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Upload Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="border-2 border-dashed rounded-lg p-12 text-center"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add("bg-muted/50");
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("bg-muted/50");
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("bg-muted/50");
                          const files = e.dataTransfer.files;
                          if (files.length > 0) {
                            handleFileUpload(files);
                          }
                        }}
                      >
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          multiple
                          accept=".pdf,.docx,.txt"
                          onChange={(e) => handleFileUpload(e.target.files)}
                        />
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#603BFC]/10 to-[#A94FA1]/10">
                            <UploadCloud className="h-6 w-6 text-[#603BFC]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Drag and drop files here, or{" "}
                              <label
                                htmlFor="file-upload"
                                className="text-[#603BFC] cursor-pointer hover:underline"
                              >
                                browse
                              </label>
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Supported formats: PDF, DOCX, TXT (Max size:
                              100MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document List */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Documents</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Search */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Table */}
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={
                                    selectedRows.size ===
                                      filteredDocuments.length &&
                                    filteredDocuments.length > 0
                                  }
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRows(
                                        new Set(
                                          filteredDocuments.map((d) => d.id)
                                        )
                                      );
                                    } else {
                                      setSelectedRows(new Set());
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead>Title</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Source</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Processed at</TableHead>
                              <TableHead>Version</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredDocuments.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={9}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  No documents found
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredDocuments.map((doc) => (
                                <TableRow key={doc.id}>
                                  <TableCell
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Checkbox
                                      checked={selectedRows.has(doc.id)}
                                      onCheckedChange={(checked) => {
                                        const newSet = new Set(selectedRows);
                                        if (checked) {
                                          newSet.add(doc.id);
                                        } else {
                                          newSet.delete(doc.id);
                                        }
                                        setSelectedRows(newSet);
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {doc.title}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {doc.category
                                        .slice(0, 2)
                                        .map((cat, idx) => (
                                          <Badge
                                            key={idx}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {cat}
                                          </Badge>
                                        ))}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {doc.source}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {doc.size} KB
                                    {doc.pages ? ` • ${doc.pages} pages` : ""}
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(doc.status)}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {doc.processedAt
                                      ? getTimeAgo(new Date(doc.processedAt))
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    v{doc.version}
                                  </TableCell>
                                  <TableCell
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleReprocess(doc.id)
                                          }
                                        >
                                          <RefreshCw className="h-4 w-4 mr-2" />
                                          Reprocess
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Download className="h-4 w-4 mr-2" />
                                          Download
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(doc.id)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        Showing {filteredDocuments.length} document
                        {filteredDocuments.length !== 1 ? "s" : ""}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="improve-with-ai" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Coverage map</CardTitle>
                    <CardDescription>
                      View topic coverage and identify gaps in your knowledge
                      base
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Top topics covered
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {aiInsights.topTopics.map((topic, idx) => (
                          <Badge
                            key={idx}
                            variant="default"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Coverage gaps
                      </h4>
                      <div className="space-y-2">
                        {aiInsights.gaps.map((gap, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between border rounded p-2"
                          >
                            <span className="text-sm">{gap}</span>
                            <Button size="sm" variant="outline">
                              Auto-generate missing page
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Duplicate detection</CardTitle>
                    <CardDescription>
                      Documents with high similarity scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aiInsights.duplicateWarnings === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No duplicate documents detected.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="border rounded p-3 text-sm">
                          <p className="font-medium">VPN Setup Guide</p>
                          <p className="text-muted-foreground">
                            Similarity: 87% with "VPN Configuration"
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI suggestions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border rounded p-3">
                      <p className="text-sm font-medium mb-1">
                        Add step-by-step VPN guide
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Based on frequent queries, a detailed VPN setup guide
                        would improve coverage.
                      </p>
                      <Button size="sm" variant="outline">
                        Open doc editor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-configuration" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Configuration</CardTitle>
                    <CardDescription>
                      Configure how documents are processed and embedded for AI
                      retrieval
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Chunk size</Label>
                      <Select defaultValue="500">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="200">200 tokens</SelectItem>
                          <SelectItem value="500">500 tokens</SelectItem>
                          <SelectItem value="1000">1000 tokens</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Size of text chunks for embedding. Smaller chunks
                        provide more granular retrieval.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Embedding model</Label>
                      <Select defaultValue="text-embedding-ada-002">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text-embedding-ada-002">
                            text-embedding-ada-002
                          </SelectItem>
                          <SelectItem value="text-embedding-3-small">
                            text-embedding-3-small
                          </SelectItem>
                          <SelectItem value="text-embedding-3-large">
                            text-embedding-3-large
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Model used for generating document embeddings.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Reprocess on update</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically reprocess documents when they are
                          updated
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label>Ingestion schedule</Label>
                      <Select defaultValue="manual">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        How often to check for new documents from connected
                        sources.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Relevance threshold</Label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          defaultValue="70"
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0 (more results)</span>
                          <span>100 (fewer, higher quality)</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum similarity score for document retrieval (0-100).
                      </p>
                    </div>

                    <Button className="w-full">Save settings</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
