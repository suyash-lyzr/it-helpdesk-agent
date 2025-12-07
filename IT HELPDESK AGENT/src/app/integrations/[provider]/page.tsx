"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAdminMode } from "@/contexts/admin-mode-context";
import type {
  AuditLogEntry,
  IntegrationConfig,
  IntegrationProvider,
} from "@/lib/integrations-types";
import {
  connectIntegrationApi,
  createDemoJiraIssue,
  createDemoServiceNowIncident,
  demoGoogleCheckDevice,
  demoOktaProvision,
  disconnectIntegrationApi,
  fetchIntegrationLogs,
  fetchIntegrationMapping,
  fetchIntegrations,
  replayWebhook,
  saveIntegrationMapping,
  startJiraOAuth,
  testIntegrationApi,
} from "@/lib/integrations-api";
import { describeWebhookEvent } from "@/lib/integration-webhook-utils";
import {
  Shield,
  RefreshCw,
  Zap,
  Settings,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

type ProviderParam = IntegrationProvider;

const LOCAL_FIELDS = [
  "ticket.title",
  "ticket.description",
  "ticket.priority",
  "ticket.assignee",
  "ticket.component",
];

const DEMO_EVENTS: Record<
  IntegrationProvider,
  { id: string; label: string }[]
> = {
  jira: [{ id: "jira.ticket.updated", label: "jira.ticket.updated" }],
  servicenow: [
    {
      id: "servicenow.incident.resolved",
      label: "servicenow.incident.resolved",
    },
  ],
  okta: [{ id: "okta.user.provisioned", label: "okta.user.provisioned" }],
  google: [{ id: "google.device.offline", label: "google.device.offline" }],
};

export default function IntegrationDetailPage() {
  const { provider } = useParams<{ provider: ProviderParam }>();
  const [integration, setIntegration] = useState<IntegrationConfig | null>(
    null
  );
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | undefined>(
    DEMO_EVENTS[provider]?.[0]?.id
  );
  const [demoTitle, setDemoTitle] = useState("VPN disconnecting");
  const [demoDescription, setDemoDescription] = useState(
    "User reports frequent VPN disconnects while working from home."
  );
  const [apiTokenUrl, setApiTokenUrl] = useState("");
  const [apiTokenEmail, setApiTokenEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [fieldMappingOpen, setFieldMappingOpen] = useState(false);
  const { isAdmin } = useAdminMode();

  const isJira = provider === "jira";

  useEffect(() => {
    void (async () => {
      try {
        const all = await fetchIntegrations();
        const current = all.find((i) => i.meta.id === provider) ?? null;
        setIntegration(current);
        const [m, l] = await Promise.all([
          fetchIntegrationMapping(provider),
          fetchIntegrationLogs(provider, 10),
        ]);
        setMappings(m);
        setLogs(l);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load integration details");
      } finally {
        setLoading(false);
      }
    })();
  }, [provider]);

  const handleConnectDemo = async () => {
    if (!isAdmin) return;
    setBusy(true);
    try {
      const res = await connectIntegrationApi(provider, { mode: "demo" });
      toast.success("Connected in demo mode");
      setIntegration(
        (prev) =>
          prev && {
            ...prev,
            status: "connected",
            mode: "demo",
            maskedToken:
              (res as { masked_token?: string }).masked_token ??
              prev.maskedToken,
          }
      );
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect (demo)");
    } finally {
      setBusy(false);
    }
  };

  const handleJiraRealOAuth = async () => {
    if (!isAdmin || provider !== "jira") return;
    setBusy(true);
    try {
      const res = await startJiraOAuth();
      if (!res.success || !res.authorizeUrl) {
        const message =
          res.message ??
          "Jira OAuth is not configured. Please set JIRA_CLIENT_ID and JIRA_REDIRECT_URI environment variables, or use the API Token option below.";
        toast.error(message, {
          duration: 6000,
        });
        return;
      }
      window.location.href = res.authorizeUrl;
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to start Jira OAuth. Please check your configuration or use the API Token option below.",
        {
          duration: 6000,
        }
      );
    } finally {
      setBusy(false);
    }
  };

  const handleConnectApiToken = async () => {
    if (!isAdmin || !apiTokenUrl || !apiTokenEmail || !apiToken) {
      toast.error("Please fill in all API token fields");
      return;
    }
    setBusy(true);
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll use the demo connect flow
      const res = await connectIntegrationApi(provider, {
        mode: "real",
        baseUrl: apiTokenUrl,
        email: apiTokenEmail,
        token: apiToken,
      });
      toast.success("Connected using API token");
      setIntegration(
        (prev) =>
          prev && {
            ...prev,
            status: "connected",
            mode: "real",
            maskedToken: "xxxx-xxxx-xxxx",
          }
      );
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
      // Clear form
      setApiTokenUrl("");
      setApiTokenEmail("");
      setApiToken("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect using API token");
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!isAdmin) return;
    setBusy(true);
    try {
      await disconnectIntegrationApi(provider);
      toast.success("Integration disconnected");
      setIntegration(
        (prev) =>
          prev && {
            ...prev,
            status: "disconnected",
            maskedToken: undefined,
            connectedAt: undefined,
          }
      );
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Failed to disconnect");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveMappings = async () => {
    if (!isAdmin) return;
    setBusy(true);
    try {
      const next = await saveIntegrationMapping(provider, mappings);
      setMappings(next);
      toast.success("Mappings saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save mappings");
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      const res = await testIntegrationApi(provider);
      const message =
        (res as { message?: string }).message ??
        "Test executed successfully (demo)";
      toast.success(message);
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Test failed");
    } finally {
      setBusy(false);
    }
  };

  const handleWebhookReplay = async () => {
    if (!selectedEvent) return;
    setWebhookBusy(true);
    try {
      const res = await replayWebhook({
        provider,
        sampleEventId: selectedEvent,
      });
      if (!res.success) {
        toast.error("Webhook replay failed");
        return;
      }
      const description = describeWebhookEvent(
        res.event as {
          provider: string;
          event: string;
          external_id?: string;
          [key: string]: unknown;
        }
      );
      toast.success(description);
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Webhook replay failed");
    } finally {
      setWebhookBusy(false);
    }
  };

  const handleDemoAction = async () => {
    if (!isAdmin) return;
    setBusy(true);
    try {
      if (provider === "jira") {
        const res = await createDemoJiraIssue({
          title: demoTitle,
          description: demoDescription,
          priority: "high",
          assignee: "demo.user",
        });
        toast.success(`Created external ticket ${res.external_id} (Demo)`);
      } else if (provider === "servicenow") {
        const res = await createDemoServiceNowIncident({
          title: demoTitle,
          description: demoDescription,
        });
        toast.success(`Created ServiceNow incident ${res.external_id} (Demo)`);
      } else if (provider === "okta") {
        const res = await demoOktaProvision({
          username: "demo.user@company.com",
          groups: ["github-admins"],
          duration: "30 days",
        });
        toast.success(`Provisioning started ${res.external_id} (Demo)`);
      } else if (provider === "google") {
        const res = await demoGoogleCheckDevice();
        toast.success(`Device status: ${res.device_status}, OS ${res.os}`);
      }
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Demo action failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !integration) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "18rem",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="h-screen overflow-auto">
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading integration...
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const statusBadgeText =
    integration.status === "connected"
      ? integration.mode === "demo"
        ? "Demo Connected"
        : "Connected"
      : "Not Connected";

  const statusBadgeVariant =
    integration.status === "connected"
      ? integration.mode === "demo"
        ? "secondary"
        : "default"
      : "outline";

  // Render new JIRA-specific design
  if (isJira) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "18rem",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="h-screen overflow-auto">
          <div className="flex h-full flex-col gap-6 p-6">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Jira Integration
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sync incidents and requests with Jira Software or Jira Service
                  Management.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={statusBadgeVariant}
                  className="text-sm px-3 py-1"
                >
                  {statusBadgeText}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !isAdmin}
                  onClick={handleTest}
                >
                  Test Connection
                </Button>
                {integration.status === "connected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !isAdmin}
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                )}
                {integration.status !== "connected" && (
                  <Button
                    size="sm"
                    disabled={busy || !isAdmin}
                    onClick={handleJiraRealOAuth}
                  >
                    Start OAuth Setup
                  </Button>
                )}
              </div>
            </div>

            {/* Overview / What This Integration Does */}
            <Card>
              <CardHeader>
                <CardTitle>What this integration enables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                  <li>
                    Automatically create Jira tickets from incidents raised in
                    Lyzr Helpdesk
                  </li>
                  <li>
                    Sync Jira → Lyzr status updates (In Progress, Done,
                    Reopened)
                  </li>
                  <li>Sync comments both ways between Lyzr and Jira</li>
                  <li>
                    Push critical incidents directly to the engineering Jira
                    projects
                  </li>
                  <li>
                    Trigger Jira workflows based on IT Helpdesk automation rules
                  </li>
                  <li>Replay Jira webhooks for debugging and demo</li>
                </ul>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    All mappings and sync logic are handled automatically by
                    Lyzr. No manual configuration required.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Setup Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Steps (Required once)</CardTitle>
                <CardDescription>
                  Choose your preferred connection method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="oauth" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="oauth">
                      Option A — Recommended: OAuth Connect
                    </TabsTrigger>
                    <TabsTrigger value="api-token">
                      Option B — Alternative: API Token
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="oauth" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Click Start OAuth Setup
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use the button in the header above to begin the
                            OAuth flow
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Login with Jira admin account
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Authenticate using your Jira administrator
                            credentials
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Grant app permissions
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Authorize Lyzr to access your Jira instance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          4
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Setup complete</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            You'll be redirected back and the integration will
                            be active
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        OAuth ensures secure, rotating tokens and requires no
                        manual API key handling.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="api-token" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="jira-url">Jira Base URL</Label>
                        <Input
                          id="jira-url"
                          placeholder="https://your-company.atlassian.net"
                          value={apiTokenUrl}
                          onChange={(e) => setApiTokenUrl(e.target.value)}
                          disabled={!isAdmin || busy}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jira-email">Admin Email</Label>
                        <Input
                          id="jira-email"
                          type="email"
                          placeholder="admin@company.com"
                          value={apiTokenEmail}
                          onChange={(e) => setApiTokenEmail(e.target.value)}
                          disabled={!isAdmin || busy}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jira-token">API Token</Label>
                        <Input
                          id="jira-token"
                          type="password"
                          placeholder="Enter your Jira API token"
                          value={apiToken}
                          onChange={(e) => setApiToken(e.target.value)}
                          disabled={!isAdmin || busy}
                        />
                        <p className="text-xs text-muted-foreground">
                          Generate an API token from your Jira account settings
                        </p>
                      </div>
                      <Button
                        onClick={handleConnectApiToken}
                        disabled={
                          !isAdmin ||
                          busy ||
                          !apiTokenUrl ||
                          !apiTokenEmail ||
                          !apiToken
                        }
                        className="w-full"
                      >
                        Connect using API Token
                      </Button>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        This is only needed if your organization restricts
                        OAuth.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* What Lyzr Handles Automatically */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Automatic Configuration by Lyzr
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                  <li>Default ticket field mapping</li>
                  <li>Project sync + component lookup</li>
                  <li>SLA + priority sync</li>
                  <li>Comment direction mapping</li>
                  <li>Error retries and webhook validation</li>
                  <li>Activity log + audit visibility</li>
                  <li>Demo ticket generation</li>
                  <li>Automatic fallback recovery</li>
                </ul>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    You do not need to configure field mapping unless your Jira
                    setup is non-standard.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Optional: Field Mapping (Advanced) */}
            <Collapsible
              open={fieldMappingOpen}
              onOpenChange={setFieldMappingOpen}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Advanced Settings — Field Mapping
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          fieldMappingOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                    <CardDescription>
                      Modify field mappings for custom Jira configurations
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            ticket.title
                          </p>
                        </div>
                        <Select
                          value={mappings.title ?? "ticket.title"}
                          onValueChange={(value) =>
                            setMappings((prev) => ({ ...prev, title: value }))
                          }
                          disabled={!isAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCAL_FIELDS.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium">
                            Description
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            ticket.description
                          </p>
                        </div>
                        <Select
                          value={mappings.description ?? "ticket.description"}
                          onValueChange={(value) =>
                            setMappings((prev) => ({
                              ...prev,
                              description: value,
                            }))
                          }
                          disabled={!isAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCAL_FIELDS.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium">
                            Priority
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            ticket.priority
                          </p>
                        </div>
                        <Select
                          value={mappings.priority ?? "ticket.priority"}
                          onValueChange={(value) =>
                            setMappings((prev) => ({
                              ...prev,
                              priority: value,
                            }))
                          }
                          disabled={!isAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCAL_FIELDS.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium">
                            Assignee
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            ticket.assignee
                          </p>
                        </div>
                        <Select
                          value={mappings.assignee ?? "ticket.assignee"}
                          onValueChange={(value) =>
                            setMappings((prev) => ({
                              ...prev,
                              assignee: value,
                            }))
                          }
                          disabled={!isAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCAL_FIELDS.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium">Project</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            ticket.component
                          </p>
                        </div>
                        <Select
                          value={mappings.project ?? "ticket.component"}
                          onValueChange={(value) =>
                            setMappings((prev) => ({ ...prev, project: value }))
                          }
                          disabled={!isAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCAL_FIELDS.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-3">
                        These defaults work for 95% of Jira installations.
                        Modify only if your Jira uses custom fields.
                      </p>
                      <Button
                        size="sm"
                        disabled={busy || !isAdmin}
                        onClick={handleSaveMappings}
                      >
                        Save Mappings
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Connection Test & Sample Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Test & Validate Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Demo Ticket Title</Label>
                    <Input
                      value={demoTitle}
                      onChange={(e) => setDemoTitle(e.target.value)}
                      placeholder="Enter ticket title"
                      disabled={!isAdmin || busy}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Demo Ticket Description</Label>
                    <Textarea
                      value={demoDescription}
                      onChange={(e) => setDemoDescription(e.target.value)}
                      placeholder="Enter ticket description"
                      className="min-h-[80px]"
                      disabled={!isAdmin || busy}
                    />
                  </div>
                  <Button
                    onClick={handleDemoAction}
                    disabled={busy || !isAdmin}
                    className="w-full"
                  >
                    Create Sample Ticket in Jira (Demo)
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm">Webhook Replay Event</Label>
                  <Select
                    value={selectedEvent}
                    onValueChange={setSelectedEvent}
                    disabled={webhookBusy}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select webhook event" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_EVENTS[provider].map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={handleWebhookReplay}
                    disabled={webhookBusy || !selectedEvent}
                    className="w-full"
                  >
                    Replay Webhook (Demo)
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Recent Integration Activity Log
                  </Label>
                  <div className="rounded-md border bg-muted/30 max-h-[300px] overflow-y-auto">
                    {logs.length > 0 ? (
                      <div className="divide-y">
                        {logs.map((log) => (
                          <div key={log.id} className="p-3 text-xs">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-medium">{log.action}</span>
                              <span className="text-muted-foreground whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {log.details && (
                              <pre className="mt-2 text-[10px] bg-background p-2 rounded border overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No activity log entries yet. Connect and run a test to
                        see activity.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t">
              {integration.status === "connected" && (
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={busy || !isAdmin}
                >
                  Disconnect Integration
                </Button>
              )}
              <Button onClick={handleSaveMappings} disabled={busy || !isAdmin}>
                Save Settings
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Original design for non-JIRA providers
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen overflow-auto">
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {integration.meta.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {integration.meta.description}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {integration.status === "connected"
                    ? integration.mode === "demo"
                      ? "Demo connected"
                      : "Connected"
                    : "Not connected"}
                </Badge>
                {integration.lastTestAt && (
                  <span className="text-xs text-muted-foreground">
                    Last test:{" "}
                    {new Date(integration.lastTestAt).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !isAdmin}
                  onClick={handleTest}
                >
                  Test connection
                </Button>
                {integration.status === "connected" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !isAdmin}
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={busy || !isAdmin}
                    onClick={handleConnectDemo}
                  >
                    Connect (Demo)
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Field Mapping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "title",
                  "description",
                  "priority",
                  "assignee",
                  "project",
                ].map((key) => (
                  <div
                    key={key}
                    className="grid grid-cols-2 gap-2 items-center"
                  >
                    <div>
                      <Label className="text-xs capitalize">{key}</Label>
                      <p className="text-[10px] text-muted-foreground">
                        Local: ticket.{key === "project" ? "component" : key}
                      </p>
                    </div>
                    <Select
                      value={mappings[key] ?? ""}
                      onValueChange={(value) =>
                        setMappings((prev) => ({
                          ...prev,
                          [key]: value,
                        }))
                      }
                      disabled={!isAdmin}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select external field" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCAL_FIELDS.map((field) => (
                          <SelectItem
                            key={field}
                            value={field}
                            className="text-xs"
                          >
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={busy || !isAdmin}
                    onClick={handleSaveMappings}
                  >
                    Save mappings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {provider === "servicenow" && (
                  <>
                    <Label className="text-xs">Demo title</Label>
                    <Input
                      value={demoTitle}
                      onChange={(e) => setDemoTitle(e.target.value)}
                      className="h-8 text-xs"
                      disabled={!isAdmin}
                    />
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={demoDescription}
                      onChange={(e) => setDemoDescription(e.target.value)}
                      className="min-h-[60px] text-xs"
                      disabled={!isAdmin}
                    />
                  </>
                )}
                <Button
                  size="sm"
                  className="w-full"
                  disabled={busy || !isAdmin}
                  onClick={handleDemoAction}
                >
                  {provider === "servicenow" && "Create incident (Demo)"}
                  {provider === "okta" && "Provision user (Demo)"}
                  {provider === "google" && "Check device (Demo)"}
                </Button>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Webhook replay</span>
                  </div>
                  <Select
                    value={selectedEvent}
                    onValueChange={setSelectedEvent}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select sample event" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_EVENTS[provider].map((event) => (
                        <SelectItem
                          key={event.id}
                          value={event.id}
                          className="text-xs"
                        >
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={webhookBusy}
                    onClick={handleWebhookReplay}
                  >
                    Replay webhook (Demo)
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    This simulates an incoming webhook and shows how the agent
                    or dashboard would react.
                  </p>
                </div>

                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      Recent audit log
                    </span>
                  </div>
                  <div className="space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="rounded-md border px-2 py-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {log.details && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        No audit log entries yet. Connect and run a test to see
                        activity.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
