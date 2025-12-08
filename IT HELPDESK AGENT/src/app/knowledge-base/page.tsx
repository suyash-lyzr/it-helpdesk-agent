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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Eye,
  Pencil,
  Archive,
  AlertCircle,
  Loader2,
  ExternalLink,
  Link as LinkIcon,
  Filter,
  Calendar,
  ChevronRight,
  ChevronDown,
  Info,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

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

interface CoverageGap {
  id: string;
  title: string;
  occurrences: number;
  slaImpact?: boolean;
}

interface TicketExample {
  id: string;
  title: string;
  excerpt: string;
  timestamp: string;
}

type SuggestionPriority = "High" | "Medium" | "Low";
type SuggestionStatus = "pending" | "draft" | "resolved" | "archived";

interface AISuggestion {
  id: string;
  title: string;
  summary: string;
  draft: string;
  ticketCount: number;
  priority: SuggestionPriority;
  confidence: number;
  status: SuggestionStatus;
  lastSeen: string;
  category?: string[];
  tags?: string[];
  exampleTickets: TicketExample[];
  createdAt: string;
}

interface DuplicatePair {
  id: string;
  doc1: { id: string; title: string };
  doc2: { id: string; title: string };
  similarity: number;
}

interface InsertAuditEntry {
  id: string;
  user: string;
  timestamp: string;
  suggestionId: string;
  action: string;
  kbDocumentId?: string;
  kbDocumentTitle?: string;
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

// Seeded demo suggestions data
const initialCoverageGaps: CoverageGap[] = [
  {
    id: "gap1",
    title: "Outlook troubleshooting guide",
    occurrences: 15,
    slaImpact: true,
  },
  {
    id: "gap2",
    title: "MFA enrollment troubleshooting",
    occurrences: 8,
    slaImpact: false,
  },
  {
    id: "gap3",
    title: "Jira SSO password reset via Okta",
    occurrences: 12,
    slaImpact: false,
  },
];

const initialSuggestions: AISuggestion[] = [
  {
    id: "s1",
    title: "Outlook troubleshooting guide",
    summary: "Comprehensive guide for common Outlook issues and solutions",
    draft: `Steps:

1. Open System Settings → Network → VPN → Add IKEv2 connection.

2. Enter company gateway, username, and company-issued certificate. (If prompted import cert from /Downloads)

3. On Apple silicon ensure VPN client vX+ is installed; run \`sudo spctl --master-enable\` if kernel extension blocked.

Troubleshooting:

- Error "authentication failed": check username & certificate expiry.

- If disconnects on sleep: set VPN to reconnect on wake in settings.`,
    ticketCount: 12,
    priority: "High",
    confidence: 0.92,
    status: "pending",
    lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: ["Network", "Security"],
    tags: ["VPN", "macOS", "Apple Silicon"],
    exampleTickets: [
      {
        id: "t1",
        title: "VPN disconnects on Mac M2 while WFH",
        excerpt: "VPN connection drops every 30 minutes on M2 MacBook Pro...",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "t2",
        title: "Cannot connect to VPN after password rotation",
        excerpt:
          "After password change, VPN connection fails with auth error...",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "s2",
    title: "Jira SSO password reset via Okta",
    summary: "Guide for resetting Jira SSO password through Okta portal",
    draft: `Steps to reset SSO password for Jira:

1. Navigate to Okta portal (company.okta.com)
2. Go to Settings → My Account → Change Password
3. Complete password reset flow with strong password requirements
4. Wait 5-10 minutes for SSO sync across all applications
5. Clear browser cache and cookies
6. Log back into Jira using new password

Common issues:
- If still can't login: wait 15 minutes for full propagation
- Browser cache: Use incognito/private mode to test
- Multi-factor authentication: ensure MFA device is accessible

Manager approval template for admin access:
[Manager approval required for admin access requests - use separate process]`,
    ticketCount: 12,
    priority: "High",
    confidence: 0.85,
    status: "pending",
    lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: ["Authentication", "Software"],
    tags: ["SSO", "Jira", "Okta"],
    exampleTickets: [
      {
        id: "t3",
        title: "Forgot Jira password, need SSO reset",
        excerpt: "Unable to access Jira, need to reset password via Okta...",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "t7",
        title: "Jira SSO not working after password change",
        excerpt: "Changed Okta password but still can't login to Jira...",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "s3",
    title: "MFA enrollment troubleshooting",
    summary: "Troubleshooting guide for common MFA enrollment issues",
    draft: `Common MFA enrollment failures and solutions:

1. App installation issues:
   - Ensure authenticator app is latest version (Microsoft Authenticator, Google Authenticator, Duo Mobile)
   - Check device compatibility and OS requirements

2. QR code scan failures:
   - Clean camera lens and ensure good lighting
   - Increase screen brightness
   - Use manual entry code instead of QR scan

3. Time sync errors:
   - Ensure device time is set to automatic
   - Restart authenticator app after time correction
   - Verify time zone is correct

4. Backup code generation:
   - Save codes securely before completing enrollment
   - Store in password manager or secure note app
   - Print and store physical copy in safe location

5. Account lockout issues:
   - Contact IT helpdesk to reset MFA
   - Use backup codes if available
   - Verify username is correct`,
    ticketCount: 8,
    priority: "High",
    confidence: 0.91,
    status: "pending",
    lastSeen: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: ["Authentication", "Security"],
    tags: ["MFA", "2FA", "Enrollment"],
    exampleTickets: [
      {
        id: "t4",
        title: "MFA enrollment QR code won't scan",
        excerpt: "Trying to set up MFA but QR code scanner fails repeatedly...",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "t8",
        title: "Time sync error during MFA setup",
        excerpt: "Getting 'invalid code' error during MFA enrollment...",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "s4",
    title: "How to set up VPN on macOS (Apple silicon)",
    summary: "Step-by-step guide for configuring VPN on Apple Silicon Macs",
    draft: `Steps:

1. Open System Settings → Network → VPN → Add IKEv2 connection.

2. Enter company gateway, username, and company-issued certificate. (If prompted import cert from /Downloads)

3. On Apple silicon ensure VPN client vX+ is installed; run \`sudo spctl --master-enable\` if kernel extension blocked.

Troubleshooting:

- Error "authentication failed": check username & certificate expiry.

- If disconnects on sleep: set VPN to reconnect on wake in settings.`,
    ticketCount: 7,
    priority: "Medium",
    confidence: 0.82,
    status: "pending",
    lastSeen: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    category: ["Network", "Security"],
    tags: ["VPN", "macOS", "Apple Silicon"],
    exampleTickets: [
      {
        id: "t5",
        title: "VPN disconnects on Mac M2 while WFH",
        excerpt: "VPN connection drops every 30 minutes on M2 MacBook Pro...",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "s5",
    title: "How to request admin access to Jira (manager approval template)",
    summary:
      "Process and template for requesting Jira admin access with manager approval",
    draft: `Jira Admin Access Request Process:

1. Identify required permissions:
   - Project admin
   - Space admin
   - Global admin (rare)

2. Submit request via IT portal:
   - Include justification
   - Attach manager approval email
   - Specify project/space names

3. Manager approval template:
   Subject: Approval for Jira Admin Access - [Your Name]
   
   I approve [Name]'s request for Jira admin access to [Project/Space] for [Reason].
   
   [Manager Name]
   [Date]

4. Wait for IT review (2-3 business days)
5. Receive access confirmation email
6. Test permissions before production use`,
    ticketCount: 5,
    priority: "Medium",
    confidence: 0.73,
    status: "pending",
    lastSeen: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    category: ["Access", "Software"],
    tags: ["Jira", "Admin", "Approval"],
    exampleTickets: [
      {
        id: "t6",
        title: "Need admin access to Jira project",
        excerpt:
          "Requesting admin permissions for Project X, manager approved...",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialDuplicates: DuplicatePair[] = [];

const initialInsertAudit: InsertAuditEntry[] = [];

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

  // Improve with AI state
  const [suggestions, setSuggestions] =
    React.useState<AISuggestion[]>(initialSuggestions);
  const [coverageGaps] = React.useState<CoverageGap[]>(initialCoverageGaps);
  const [duplicates] = React.useState<DuplicatePair[]>(initialDuplicates);
  const [insertAudit, setInsertAudit] =
    React.useState<InsertAuditEntry[]>(initialInsertAudit);
  const [selectedSuggestion, setSelectedSuggestion] =
    React.useState<AISuggestion | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = React.useState<
    Set<string>
  >(new Set());
  const [editingTitle, setEditingTitle] = React.useState("");
  const [editingDraft, setEditingDraft] = React.useState("");
  const [editingCategory, setEditingCategory] = React.useState<string[]>([]);
  const [editingTags, setEditingTags] = React.useState<string[]>([]);
  const [editingVisibility, setEditingVisibility] = React.useState<
    "Internal" | "Public"
  >("Internal");
  const [timeWindow, setTimeWindow] = React.useState<7 | 30 | 90>(30);
  const [confidencePreset, setConfidencePreset] = React.useState<
    "Conservative" | "Balanced" | "Aggressive"
  >("Balanced");
  const [showAdvancedConfidence, setShowAdvancedConfidence] =
    React.useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = React.useState([50]);
  const [teamFilter, setTeamFilter] = React.useState<string>("all");
  const [suggestionSearchQuery, setSuggestionSearchQuery] = React.useState("");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showInsertConfirm, setShowInsertConfirm] = React.useState(false);
  const [insertingSuggestionId, setInsertingSuggestionId] = React.useState<
    string | null
  >(null);
  const [showBulkInsertConfirm, setShowBulkInsertConfirm] =
    React.useState(false);
  const [isExampleTicketsOpen, setIsExampleTicketsOpen] = React.useState(false);

  // AI Configuration states
  const [systemInstructions, setSystemInstructions] = React.useState(
    "You are a helpful IT support assistant. Provide accurate, actionable troubleshooting steps and follow IT service guidelines."
  );

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

  // Improve with AI handlers
  function handleSelectSuggestion(suggestion: AISuggestion) {
    setSelectedSuggestion(suggestion);
    setEditingTitle(suggestion.title);
    setEditingDraft(suggestion.draft);
    setEditingCategory(suggestion.category || []);
    setEditingTags(suggestion.tags || []);
    setEditingVisibility("Internal");
  }

  function handleInsertSuggestion(suggestionId: string) {
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    const finalTitle = editingTitle || suggestion.title;
    const finalDraft = editingDraft || suggestion.draft;

    // Create new KB document
    const newDoc: Document = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: finalTitle,
      category: editingCategory.length > 0 ? editingCategory : ["Generated"],
      source: "Manual",
      size: Math.round((finalDraft.length / 1024) * 100) / 100,
      pages: Math.ceil(finalDraft.split("\n").length / 20),
      status: "Processing",
      processedAt: null,
      version: 1,
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === suggestionId
          ? { ...s, status: "resolved" as SuggestionStatus }
          : s
      )
    );
    setInsertAudit((prev) => [
      {
        id: Date.now().toString(),
        user: "Sample User",
        timestamp: new Date().toISOString(),
        suggestionId,
        action: "Insert into Knowledge Base",
        kbDocumentId: newDoc.id,
        kbDocumentTitle: finalTitle,
      },
      ...prev,
    ]);

    // Simulate processing
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === newDoc.id
            ? {
                ...d,
                status: "Processed",
                processedAt: new Date().toISOString(),
                chunks: Math.floor(finalDraft.length / 500) + 1,
                embeddings: 1536,
                lastEmbedTime: new Date().toISOString(),
              }
            : d
        )
      );
    }, 2000);

    toast.success(`Created KB: ${finalTitle} — View`, {
      action: {
        label: "View",
        onClick: () => {
          // Could navigate to document
        },
      },
    });

    setShowInsertConfirm(false);
    setInsertingSuggestionId(null);
    setSelectedSuggestion(null);
  }

  function handleBulkInsert() {
    if (selectedSuggestions.size === 0) {
      toast.error("No suggestions selected");
      return;
    }

    selectedSuggestions.forEach((id) => {
      handleInsertSuggestion(id);
    });

    setSelectedSuggestions(new Set());
    setShowBulkInsertConfirm(false);
  }

  function handleArchiveSuggestion(suggestionId: string) {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === suggestionId
          ? { ...s, status: "archived" as SuggestionStatus }
          : s
      )
    );
    if (selectedSuggestion?.id === suggestionId) {
      setSelectedSuggestion(null);
    }
    toast.success("Suggestion archived");
  }

  function handleRefreshSuggestions() {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Analysis refreshed");
    }, 2000);
  }

  function handleAutoGenerateFromGap(gapId: string) {
    // Check if it's a gap or a suggestion ID
    if (gapId.startsWith("suggestion-")) {
      const suggestionId = gapId.replace("suggestion-", "");
      const suggestion = suggestions.find((s) => s.id === suggestionId);
      if (suggestion) {
        handleSelectSuggestion(suggestion);
        toast.success(`Opened draft editor for ${suggestion.title}`);
      }
      return;
    }

    const gap = coverageGaps.find((g) => g.id === gapId);
    if (!gap) return;

    // Create a suggestion from the gap
    const newSuggestion: AISuggestion = {
      id: "gap-suggestion-" + gapId,
      title: gap.title,
      summary: `Auto-generated suggestion for ${gap.title}`,
      draft: `# ${gap.title}\n\nThis article addresses ${gap.occurrences} ticket occurrences.\n\n[Content will be generated from ticket analysis]`,
      ticketCount: gap.occurrences,
      priority:
        gap.occurrences > 10 ? "High" : gap.occurrences > 5 ? "Medium" : "Low",
      confidence: 0.75,
      status: "pending",
      lastSeen: new Date().toISOString(),
      category: [],
      tags: [],
      exampleTickets: [],
      createdAt: new Date().toISOString(),
    };

    setSuggestions((prev) => [newSuggestion, ...prev]);
    handleSelectSuggestion(newSuggestion);
    toast.success(`Generated suggestion for ${gap.title}`);
  }

  // Filter suggestions (using default balanced threshold of 50%)
  const filteredSuggestions = suggestions.filter((s) => {
    if (s.status === "archived") return false;
    if (
      suggestionSearchQuery &&
      !s.title.toLowerCase().includes(suggestionSearchQuery.toLowerCase())
    ) {
      return false;
    }
    if (
      teamFilter !== "all" &&
      s.category &&
      !s.category.includes(teamFilter)
    ) {
      return false;
    }
    return true;
  });

  const lastAnalysisRun = new Date(
    Date.now() - 2 * 60 * 60 * 1000
  ).toISOString(); // 2 hours ago

  return (
    <TooltipProvider>
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
                  Manage knowledge base documents and AI assistant
                  configuration.
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
                        <p className="text-2xl font-semibold">
                          {totalDocuments}
                        </p>
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
                    Estimated coverage of commonly asked help topics
                    (algorithmic estimate)
                  </TooltipContent>
                </Tooltip>
              </div>

              <Tabs
                defaultValue="knowledge-base"
                className="flex flex-1 flex-col gap-4"
              >
                <TabsList className="w-fit">
                  <TabsTrigger value="knowledge-base">
                    Knowledge Base
                  </TabsTrigger>
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
                  {/* Controls Row */}
                  <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Time window:</Label>
                      <Select
                        value={timeWindow.toString()}
                        onValueChange={(value) =>
                          setTimeWindow(Number(value) as 7 | 30 | 90)
                        }
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRefreshSuggestions}
                      disabled={isRefreshing}
                      className="h-8"
                    >
                      {isRefreshing ? (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-2" />
                      )}
                      Refresh
                    </Button>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Team:</Label>
                      <Select value={teamFilter} onValueChange={setTeamFilter}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All teams</SelectItem>
                          <SelectItem value="Network">Network</SelectItem>
                          <SelectItem value="Security">Security</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last analysis: {getTimeAgo(new Date(lastAnalysisRun))}
                    </div>
                  </div>

                  {/* Two-Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6">
                    {/* Left Column - Coverage Map */}
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            Coverage map — high-level overview
                          </CardTitle>
                          <CardDescription className="text-xs">
                            View topic coverage and identify knowledge gaps in
                            your knowledge base.
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
                              {coverageGaps.map((gap) => (
                                <div
                                  key={gap.id}
                                  className="flex items-center justify-between border rounded p-2 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="text-sm font-medium">
                                      {gap.title}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {gap.occurrences} tickets
                                    </Badge>
                                    {gap.slaImpact && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <AlertCircle className="h-3 w-3 text-orange-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          SLA impact detected
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-xs"
                              onClick={() => {
                                // Navigate to coverage report
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View topic coverage report
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Duplicate Detection */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            Duplicate detection
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {duplicates.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No duplicate documents detected.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {duplicates.slice(0, 3).map((dup) => (
                                <div
                                  key={dup.id}
                                  className="flex items-center justify-between border rounded p-2"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {dup.doc1.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Similarity: {dup.similarity}% with &quot;
                                      {dup.doc2.title}&quot;
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    Review
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column - Suggestions Panel */}
                    <div className="space-y-4">
                      <Card className="h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">
                                Knowledge gaps & suggestions — actionable drafts
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                AI-generated article suggestions based on recent
                                tickets. Review, edit, and insert into your
                                knowledge base.
                              </CardDescription>
                            </div>
                            {selectedSuggestions.size > 0 && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setShowBulkInsertConfirm(true)}
                                className="text-xs"
                              >
                                Insert Selected ({selectedSuggestions.size})
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Search */}
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search suggestions..."
                              value={suggestionSearchQuery}
                              onChange={(e) =>
                                setSuggestionSearchQuery(e.target.value)
                              }
                              className="pl-8 text-sm h-8"
                            />
                          </div>

                          {/* Suggestions List */}
                          <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {filteredSuggestions.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-8">
                                No suggestions found
                              </p>
                            ) : (
                              filteredSuggestions.map((suggestion) => (
                                <Card
                                  key={suggestion.id}
                                  className={`cursor-pointer transition-all ${
                                    selectedSuggestion?.id === suggestion.id
                                      ? "border-[#603BFC] shadow-md"
                                      : "hover:shadow-sm"
                                  }`}
                                  onClick={() =>
                                    handleSelectSuggestion(suggestion)
                                  }
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-2">
                                      <Checkbox
                                        checked={selectedSuggestions.has(
                                          suggestion.id
                                        )}
                                        onCheckedChange={(checked) => {
                                          const newSet = new Set(
                                            selectedSuggestions
                                          );
                                          if (checked) {
                                            newSet.add(suggestion.id);
                                          } else {
                                            newSet.delete(suggestion.id);
                                          }
                                          setSelectedSuggestions(newSet);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-1"
                                      />
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                          <h4 className="text-sm font-semibold">
                                            {suggestion.title}
                                          </h4>
                                          <div className="flex items-center gap-1">
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectSuggestion(
                                                      suggestion
                                                    );
                                                  }}
                                                >
                                                  <Eye className="h-3 w-3" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                Preview
                                              </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectSuggestion(
                                                      suggestion
                                                    );
                                                  }}
                                                >
                                                  <Zap className="h-3 w-3" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                Auto-generate draft
                                              </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setInsertingSuggestionId(
                                                      suggestion.id
                                                    );
                                                    setEditingTitle(
                                                      suggestion.title
                                                    );
                                                    setEditingDraft(
                                                      suggestion.draft
                                                    );
                                                    setEditingCategory(
                                                      suggestion.category || []
                                                    );
                                                    setEditingTags(
                                                      suggestion.tags || []
                                                    );
                                                    setShowInsertConfirm(true);
                                                  }}
                                                >
                                                  <CheckCircle2 className="h-3 w-3" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                Insert into KB
                                              </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleArchiveSuggestion(
                                                      suggestion.id
                                                    );
                                                  }}
                                                >
                                                  <XCircle className="h-3 w-3" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                Ignore
                                              </TooltipContent>
                                            </Tooltip>
                                          </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {suggestion.summary}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {suggestion.ticketCount} tickets
                                          </Badge>
                                          <Badge
                                            variant={
                                              suggestion.priority === "High"
                                                ? "destructive"
                                                : suggestion.priority ===
                                                  "Medium"
                                                ? "default"
                                                : "secondary"
                                            }
                                            className="text-xs"
                                          >
                                            {suggestion.priority}
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            Confidence:{" "}
                                            {Math.round(
                                              suggestion.confidence * 100
                                            )}
                                            %
                                          </Badge>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                          >
                                            Auto-generated
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Audit Row */}
                  {insertAudit.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Insert history
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {insertAudit.slice(0, 10).map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center gap-2 text-xs border-b pb-2 last:border-0"
                            >
                              <span className="font-medium">{entry.user}</span>
                              <span className="text-muted-foreground">
                                {entry.action}
                              </span>
                              <span className="text-muted-foreground">
                                &quot;{entry.kbDocumentTitle}&quot;
                              </span>
                              <span className="text-muted-foreground ml-auto">
                                {getTimeAgo(new Date(entry.timestamp))}
                              </span>
                              {entry.kbDocumentId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 text-xs"
                                  onClick={() => {
                                    // Navigate to document
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Privacy Note */}
                  <p className="text-xs text-muted-foreground text-center">
                    Ticket text may be used to generate drafts. PII will be
                    redacted.
                  </p>

                  {/* Preview & Edit Sheet Sidebar */}
                  <Sheet
                    open={!!selectedSuggestion}
                    onOpenChange={(open) => {
                      if (!open) {
                        setSelectedSuggestion(null);
                      }
                    }}
                  >
                    <SheetContent className="w-full sm:w-[700px] overflow-y-auto p-0">
                      <div className="flex flex-col h-full">
                        <SheetHeader className="px-6 pt-6 pb-4 border-b">
                          <SheetTitle className="text-lg">
                            Preview & Edit
                          </SheetTitle>
                          <SheetDescription className="text-sm">
                            Review and edit the AI-generated suggestion before
                            inserting into your knowledge base.
                          </SheetDescription>
                        </SheetHeader>
                        {selectedSuggestion && (
                          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                            {/* Editable Title */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Title
                              </Label>
                              <Input
                                value={editingTitle}
                                onChange={(e) =>
                                  setEditingTitle(e.target.value)
                                }
                                className="text-sm"
                              />
                            </div>

                            {/* Source Badges */}
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                Detected from tickets
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Confidence:{" "}
                                {Math.round(
                                  selectedSuggestion.confidence * 100
                                )}
                                %
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Last seen:{" "}
                                {getTimeAgo(
                                  new Date(selectedSuggestion.lastSeen)
                                )}
                              </Badge>
                            </div>

                            {/* WYSIWYG Editor */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Content
                              </Label>
                              <Textarea
                                value={editingDraft}
                                onChange={(e) =>
                                  setEditingDraft(e.target.value)
                                }
                                className="min-h-[250px] text-sm font-mono resize-y"
                                placeholder="Enter article content..."
                              />
                            </div>

                            {/* Metadata */}
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Category
                                </Label>
                                <Select
                                  value={editingCategory[0] || ""}
                                  onValueChange={(value) =>
                                    setEditingCategory([value])
                                  }
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Network">
                                      Network
                                    </SelectItem>
                                    <SelectItem value="Security">
                                      Security
                                    </SelectItem>
                                    <SelectItem value="Software">
                                      Software
                                    </SelectItem>
                                    <SelectItem value="Hardware">
                                      Hardware
                                    </SelectItem>
                                    <SelectItem value="Authentication">
                                      Authentication
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Tags
                                </Label>
                                <Input
                                  value={editingTags.join(", ")}
                                  onChange={(e) =>
                                    setEditingTags(
                                      e.target.value
                                        .split(",")
                                        .map((t) => t.trim())
                                    )
                                  }
                                  placeholder="Comma-separated tags"
                                  className="text-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Visibility
                                </Label>
                                <Select
                                  value={editingVisibility}
                                  onValueChange={(
                                    value: "Internal" | "Public"
                                  ) => setEditingVisibility(value)}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Internal">
                                      Internal
                                    </SelectItem>
                                    <SelectItem value="Public">
                                      Public
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Example Tickets Accordion */}
                            {selectedSuggestion.exampleTickets.length > 0 && (
                              <Collapsible
                                open={isExampleTicketsOpen}
                                onOpenChange={setIsExampleTicketsOpen}
                              >
                                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold w-full hover:text-foreground">
                                  {isExampleTicketsOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  Example tickets (
                                  {selectedSuggestion.exampleTickets.length})
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 space-y-2">
                                  {selectedSuggestion.exampleTickets
                                    .slice(0, 3)
                                    .map((ticket) => (
                                      <div
                                        key={ticket.id}
                                        className="border rounded-lg p-3 space-y-1.5 bg-muted/30"
                                      >
                                        <p className="font-medium text-sm">
                                          {ticket.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {ticket.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <p className="text-xs text-muted-foreground">
                                            {getTimeAgo(
                                              new Date(ticket.timestamp)
                                            )}
                                          </p>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                          >
                                            View full ticket
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        )}

                        {/* Actions - Fixed at bottom */}
                        {selectedSuggestion && (
                          <div className="px-6 py-4 border-t bg-background space-y-3">
                            <div className="flex gap-2">
                              <Button
                                size="default"
                                variant="default"
                                className="flex-1"
                                onClick={() => {
                                  setInsertingSuggestionId(
                                    selectedSuggestion.id
                                  );
                                  setShowInsertConfirm(true);
                                }}
                              >
                                Insert into Knowledge Base
                              </Button>
                              <Button
                                size="default"
                                variant="outline"
                                onClick={() => {
                                  setSuggestions((prev) =>
                                    prev.map((s) =>
                                      s.id === selectedSuggestion.id
                                        ? {
                                            ...s,
                                            status: "draft" as SuggestionStatus,
                                          }
                                        : s
                                    )
                                  );
                                  toast.success("Draft saved");
                                }}
                              >
                                Save Draft
                              </Button>
                              <Button
                                size="default"
                                variant="outline"
                                onClick={() =>
                                  handleArchiveSuggestion(selectedSuggestion.id)
                                }
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                </TabsContent>

                <TabsContent
                  value="ai-configuration"
                  className="space-y-4 pt-6"
                >
                  <Card className="max-w-4xl">
                    <CardHeader>
                      <CardTitle>System Instructions</CardTitle>
                      <CardDescription>
                        Configure how the AI assistant behaves, its tone, and
                        how it responds to user queries.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Textarea
                          value={systemInstructions}
                          onChange={(e) =>
                            setSystemInstructions(e.target.value)
                          }
                          className="min-h-[200px] resize-y"
                          placeholder="Enter system instructions for the AI assistant..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Advanced AI settings (embedding, retrieval tuning) are
                          automatically managed by Lyzr.
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="default"
                          onClick={() => {
                            toast.success("Configuration saved successfully");
                          }}
                        >
                          Save Configuration
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </SidebarInset>

        {/* Insert Confirmation Modal */}
        <AlertDialog
          open={showInsertConfirm}
          onOpenChange={setShowInsertConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Insert into Knowledge Base</AlertDialogTitle>
              <AlertDialogDescription>
                Create knowledge base article titled &quot;
                {editingTitle || selectedSuggestion?.title}&quot;? This will
                mark the suggestion resolved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (insertingSuggestionId) {
                    handleInsertSuggestion(insertingSuggestionId);
                  }
                }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Insert Confirmation Modal */}
        <AlertDialog
          open={showBulkInsertConfirm}
          onOpenChange={setShowBulkInsertConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bulk Insert Suggestions</AlertDialogTitle>
              <AlertDialogDescription>
                Create {selectedSuggestions.size} knowledge base article
                {selectedSuggestions.size !== 1 ? "s" : ""}?
                {Array.from(selectedSuggestions)
                  .map((id) => {
                    const s = suggestions.find((s) => s.id === id);
                    return s?.title;
                  })
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((title, idx) => (
                    <div key={idx} className="mt-2 text-sm">
                      • {title}
                    </div>
                  ))}
                {selectedSuggestions.size > 3 && (
                  <div className="text-sm text-muted-foreground">
                    and {selectedSuggestions.size - 3} more...
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkInsert}>
                Insert All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarProvider>
    </TooltipProvider>
  );
}

/*
LLM Prompt Template for Backend Implementation:

Primary Prompt (How-to Instructions):
---
You are a technical writer. Given these ticket excerpts:

[ticket1]
[ticket2]
[ticket3]

Produce:
- A concise KB article title.
- A short summary (1 line).
- 4-6 step how-to instructions or troubleshooting steps.
- 2 suggested tags (comma separated).

Keep it short and actionable for an internal KB.

Secondary Prompt (FAQ-style):
---
You are a technical writer. Given these ticket excerpts:

[ticket1]
[ticket2]
[ticket3]

Produce:
- A concise KB article title.
- A short summary (1-2 sentence answer).
- 2-3 follow-up questions with brief answers.
- 2 suggested tags (comma separated).

Keep it concise and FAQ-style for quick reference.

Endpoint Contract:
GET /api/ai/gaps?days=30&team=...&confidence=50
Returns:
{
  suggestions: [
    {
      id: string,
      title: string,
      summary: string,
      draft: string,
      confidence: number (0-1),
      count: number,
      priority: "High" | "Medium" | "Low",
      lastSeen: ISO8601,
      examples: [
        { id: string, title: string, excerpt: string, timestamp: ISO8601 }
      ]
    }
  ]
}
*/
