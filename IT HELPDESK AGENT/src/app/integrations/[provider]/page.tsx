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
import { Switch } from "@/components/ui/switch";
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
  Info,
  Database,
  ArrowRightLeft,
  FileText,
  Webhook,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
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
    { id: "servicenow.incident.updated", label: "incident.updated" },
    { id: "servicenow.change.requested", label: "change.requested" },
    { id: "servicenow.cmdb.ci.updated", label: "cmdb.ci.updated" },
    { id: "servicenow.incident.resolved", label: "incident.resolved" },
  ],
  okta: [
    { id: "okta.user.lifecycle.created", label: "user.lifecycle.created" },
    {
      id: "okta.user.lifecycle.deactivated",
      label: "user.lifecycle.deactivated",
    },
    { id: "okta.group.user_membership", label: "group.user_membership" },
    { id: "okta.user.provisioned", label: "okta.user.provisioned" },
  ],
  google: [
    { id: "google.user.create", label: "user.create" },
    { id: "google.user.suspended", label: "user.suspended" },
    { id: "google.device.enroll", label: "device.enroll" },
    { id: "google.device.offline", label: "device.offline" },
  ],
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
  const [fieldMappingOpen, setFieldMappingOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [automaticConfigOpen, setAutomaticConfigOpen] = useState(true);
  const [demoSeverity, setDemoSeverity] = useState("3");
  const [cmdbSyncEnabled, setCmdbSyncEnabled] = useState(true);
  const [servicenowApiTokenUrl, setServicenowApiTokenUrl] = useState("");
  const [servicenowApiTokenEmail, setServicenowApiTokenEmail] = useState("");
  const [servicenowApiToken, setServicenowApiToken] = useState("");
  const [servicenowInstanceScope, setServicenowInstanceScope] = useState("");
  const [oktaApiTokenUrl, setOktaApiTokenUrl] = useState("");
  const [oktaApiToken, setOktaApiToken] = useState("");
  const [oktaIntegrationUser, setOktaIntegrationUser] = useState("");
  const [provisioningEnabled, setProvisioningEnabled] = useState(false);
  const [groupSyncEnabled, setGroupSyncEnabled] = useState(false);
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(false);
  const [provisioningSettingsOpen, setProvisioningSettingsOpen] =
    useState(false);
  const [eventHooksOpen, setEventHooksOpen] = useState(false);
  const [demoUserEmail, setDemoUserEmail] = useState("demo.user@company.com");
  const [demoUserFirstName, setDemoUserFirstName] = useState("Demo");
  const [demoUserLastName, setDemoUserLastName] = useState("User");
  const [demoUserGroup, setDemoUserGroup] = useState("github-admins");
  const [oktaEventHookUrl, setOktaEventHookUrl] = useState("");
  const [googleServiceAccountJson, setGoogleServiceAccountJson] = useState("");
  const [googleDomainName, setGoogleDomainName] = useState("");
  const [devicePostureEnabled, setDevicePostureEnabled] = useState(false);
  const [posturePolicy, setPosturePolicy] = useState("allow");
  const [groupSyncEnabledGoogle, setGroupSyncEnabledGoogle] = useState(false);
  const [autoProvisionUsers, setAutoProvisionUsers] = useState(false);
  const [groupMappingOpen, setGroupMappingOpen] = useState(false);
  const [demoGoogleEmail, setDemoGoogleEmail] = useState(
    "demo.user@company.com"
  );
  const [demoGoogleGroup, setDemoGoogleGroup] = useState("developers");
  const [activityLogFilter, setActivityLogFilter] = useState<string>("all");
  const { isAdmin } = useAdminMode();

  const isJira = provider === "jira";
  const isServiceNow = provider === "servicenow";
  const isOkta = provider === "okta";
  const isGoogle = provider === "google";

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

  const handleCreateServiceNowChange = async () => {
    if (!isAdmin || provider !== "servicenow") return;
    setBusy(true);
    try {
      const res = await createDemoServiceNowIncident({
        title: `Change Request: ${demoTitle}`,
        description: demoDescription,
        type: "change_request",
      });
      toast.success(
        `Created ServiceNow change request ${res.external_id} (Demo)`
      );
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create change request");
    } finally {
      setBusy(false);
    }
  };

  const handleCmdbDiscovery = async () => {
    if (!isAdmin || provider !== "servicenow") return;
    setBusy(true);
    try {
      // Simulate CMDB discovery
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("CMDB discovery completed successfully (Demo)");
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("CMDB discovery failed");
    } finally {
      setBusy(false);
    }
  };

  const handleServiceNowConnectApiToken = async () => {
    if (
      !isAdmin ||
      !servicenowApiTokenUrl ||
      !servicenowApiTokenEmail ||
      !servicenowApiToken
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setBusy(true);
    try {
      const res = await connectIntegrationApi(provider, {
        mode: "real",
        baseUrl: servicenowApiTokenUrl,
        email: servicenowApiTokenEmail,
        token: servicenowApiToken,
        instanceScope: servicenowInstanceScope,
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
      setServicenowApiTokenUrl("");
      setServicenowApiTokenEmail("");
      setServicenowApiToken("");
      setServicenowInstanceScope("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect using API token");
    } finally {
      setBusy(false);
    }
  };

  const handleOktaConnectApiToken = async () => {
    if (!isAdmin || !oktaApiTokenUrl || !oktaApiToken) {
      toast.error("Please fill in Okta Base URL and API token");
      return;
    }
    setBusy(true);
    try {
      const res = await connectIntegrationApi(provider, {
        mode: "real",
        baseUrl: oktaApiTokenUrl,
        token: oktaApiToken,
        integrationUser: oktaIntegrationUser,
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
      setOktaApiTokenUrl("");
      setOktaApiToken("");
      setOktaIntegrationUser("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect using API token");
    } finally {
      setBusy(false);
    }
  };

  const handleAssignOktaGroup = async () => {
    if (!isAdmin || provider !== "okta") return;
    setBusy(true);
    try {
      const res = await demoOktaProvision({
        username: demoUserEmail,
        groups: [demoUserGroup],
        duration: "30 days",
      });
      toast.success(`Assigned group ${demoUserGroup} to user (Demo)`);
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign group");
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivateOktaUser = async () => {
    if (!isAdmin || provider !== "okta") return;
    setBusy(true);
    try {
      // Simulate deactivation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Deactivated user ${demoUserEmail} (Demo)`);
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Failed to deactivate user");
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterEventHook = async () => {
    if (!isAdmin || provider !== "okta") return;
    setBusy(true);
    try {
      // Simulate event hook registration
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Event hook registered successfully (Demo)");
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Failed to register event hook");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProvisioningSettings = async () => {
    if (!isAdmin) return;
    setBusy(true);
    try {
      // In a real implementation, this would save to backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Provisioning settings saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save provisioning settings");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleConnectServiceAccount = async () => {
    if (!isAdmin || !googleServiceAccountJson || !googleDomainName) {
      toast.error("Please provide Service Account JSON and Domain name");
      return;
    }
    try {
      // Validate JSON
      JSON.parse(googleServiceAccountJson);
    } catch (error) {
      toast.error(
        "Invalid JSON format. Please check your service account file."
      );
      return;
    }
    setBusy(true);
    try {
      const res = await connectIntegrationApi(provider, {
        mode: "real",
        serviceAccountJson: googleServiceAccountJson,
        domain: googleDomainName,
      });
      toast.success("Connected using Service Account");
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
      setGoogleServiceAccountJson("");
      setGoogleDomainName("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect using Service Account");
    } finally {
      setBusy(false);
    }
  };

  const handleFetchGoogleUser = async () => {
    if (!isAdmin || provider !== "google") return;
    setBusy(true);
    try {
      const res = await demoGoogleCheckDevice();
      toast.success(
        `User fetched: ${demoGoogleEmail} - Status: ${res.device_status}, OS: ${res.os} (Demo)`
      );
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch user");
    } finally {
      setBusy(false);
    }
  };

  const handleFetchGoogleGroups = async () => {
    if (!isAdmin || provider !== "google") return;
    setBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Groups fetched successfully (Demo)");
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch groups");
    } finally {
      setBusy(false);
    }
  };

  const handleSuspendRestoreGoogleUser = async () => {
    if (!isAdmin || provider !== "google") return;
    setBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`User ${demoGoogleEmail} status toggled (Demo)`);
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user status");
    } finally {
      setBusy(false);
    }
  };

  const handleRunDeviceSync = async () => {
    if (!isAdmin || provider !== "google") return;
    setBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Device sync completed successfully (Demo)");
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Device sync failed");
    } finally {
      setBusy(false);
    }
  };

  const handleAutoDiscoverGroups = async () => {
    if (!isAdmin || provider !== "google") return;
    setBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Groups auto-discovered successfully (Demo)");
      const latest = await fetchIntegrationLogs(provider, 10);
      setLogs(latest);
    } catch (error) {
      console.error(error);
      toast.error("Failed to auto-discover groups");
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
          <div className="flex h-full flex-col gap-4 p-4">
            {/* Compact Header Block */}
            <div className="flex items-center justify-between py-3 px-4 bg-card border rounded-lg">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight">
                  Jira Integration
                </h1>
                <Badge variant={statusBadgeVariant} className="text-xs">
                  {statusBadgeText}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
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
                <Button
                  size="sm"
                  disabled={busy || !isAdmin}
                  onClick={handleSaveMappings}
                >
                  Save Settings
                </Button>
              </div>
            </div>

            {/* First Row: Cards Stacked Vertically */}
            <div className="space-y-4">
              {/* Overview / What This Integration Does - Compact */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    What this integration enables
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-5">
                  <ul className="space-y-2.5 list-disc list-inside text-sm text-muted-foreground">
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
                      Trigger Jira workflows based on IT Helpdesk automation
                      rules
                    </li>
                    <li>Replay Jira webhooks for debugging and demo</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                    <Shield className="h-3 w-3 inline mr-1.5" />
                    All mappings and sync logic are handled automatically by
                    Lyzr. No manual configuration required.
                  </p>
                </CardContent>
              </Card>

              {/* Setup Instructions - Compact Wizard Style */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    Setup Steps (Required once)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-5">
                  <Tabs defaultValue="oauth" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-9">
                      <TabsTrigger value="oauth" className="text-xs">
                        OAuth (Recommended)
                      </TabsTrigger>
                      <TabsTrigger value="api-token" className="text-xs">
                        API Token (Advanced)
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="oauth" className="space-y-3 mt-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-[10px] mt-0.5 shrink-0">
                            1
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-tight">
                              Click Start OAuth Setup
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Use the button in the header to begin the OAuth
                              flow
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-[10px] mt-0.5 shrink-0">
                            2
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-tight">
                              Login with Jira admin account
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Authenticate using your Jira administrator
                              credentials
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-[10px] mt-0.5 shrink-0">
                            3
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-tight">
                              Grant app permissions
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Authorize Lyzr to access your Jira instance
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-[10px] mt-0.5 shrink-0">
                            4
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-tight">
                              Setup complete
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              You'll be redirected back and the integration will
                              be active
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t mt-3">
                        <p className="text-xs text-muted-foreground">
                          <Shield className="h-3 w-3 inline mr-1" />
                          OAuth ensures secure, rotating tokens and requires no
                          manual API key handling.
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="api-token" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="jira-url" className="text-xs">
                            Jira Base URL
                          </Label>
                          <Input
                            id="jira-url"
                            placeholder="https://your-company.atlassian.net"
                            value={apiTokenUrl}
                            onChange={(e) => setApiTokenUrl(e.target.value)}
                            disabled={!isAdmin || busy}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="jira-email" className="text-xs">
                            Admin Email
                          </Label>
                          <Input
                            id="jira-email"
                            type="email"
                            placeholder="admin@company.com"
                            value={apiTokenEmail}
                            onChange={(e) => setApiTokenEmail(e.target.value)}
                            disabled={!isAdmin || busy}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="jira-token" className="text-xs">
                            API Token
                          </Label>
                          <Input
                            id="jira-token"
                            type="password"
                            placeholder="Enter your Jira API token"
                            value={apiToken}
                            onChange={(e) => setApiToken(e.target.value)}
                            disabled={!isAdmin || busy}
                            className="h-9"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Generate an API token from your Jira account
                            settings
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
                          className="w-full h-9"
                        >
                          Connect using API Token
                        </Button>
                      </div>
                      <div className="pt-3 border-t mt-3">
                        <p className="text-xs text-muted-foreground">
                          This is only needed if your organization restricts
                          OAuth.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Second Row: Collapsible Cards Stacked Vertically */}
            <div className="space-y-4">
              {/* What Lyzr Handles Automatically - Collapsible */}
              <Collapsible
                open={automaticConfigOpen}
                onOpenChange={setAutomaticConfigOpen}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Automatic Configuration by Lyzr
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            automaticConfigOpen ? "rotate-180" : ""
                          }`}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <ul className="space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
                        <li>Default ticket field mapping</li>
                        <li>Project sync + component lookup</li>
                        <li>SLA + priority sync</li>
                        <li>Comment direction mapping</li>
                        <li>Error retries and webhook validation</li>
                        <li>Activity log + audit visibility</li>
                        <li>Demo ticket generation</li>
                        <li>Automatic fallback recovery</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2.5 pt-2 border-t">
                        You do not need to configure field mapping unless your
                        Jira setup is non-standard.
                      </p>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Optional: Field Mapping (Advanced) - Compact */}
              <Collapsible
                open={fieldMappingOpen}
                onOpenChange={setFieldMappingOpen}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-base">
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
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3 items-center">
                          <div>
                            <Label className="text-xs font-medium">Title</Label>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
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
                            <SelectTrigger className="h-8">
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
                        <div className="grid grid-cols-2 gap-3 items-center">
                          <div>
                            <Label className="text-xs font-medium">
                              Description
                            </Label>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
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
                            <SelectTrigger className="h-8">
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
                        <div className="grid grid-cols-2 gap-3 items-center">
                          <div>
                            <Label className="text-xs font-medium">
                              Priority
                            </Label>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
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
                            <SelectTrigger className="h-8">
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
                        <div className="grid grid-cols-2 gap-3 items-center">
                          <div>
                            <Label className="text-xs font-medium">
                              Assignee
                            </Label>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
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
                            <SelectTrigger className="h-8">
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
                        <div className="grid grid-cols-2 gap-3 items-center">
                          <div>
                            <Label className="text-xs font-medium">
                              Project
                            </Label>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              ticket.component
                            </p>
                          </div>
                          <Select
                            value={mappings.project ?? "ticket.component"}
                            onValueChange={(value) =>
                              setMappings((prev) => ({
                                ...prev,
                                project: value,
                              }))
                            }
                            disabled={!isAdmin}
                          >
                            <SelectTrigger className="h-8">
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
                      <div className="pt-2 border-t mt-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          These defaults work for 95% of Jira installations.
                          Modify only if your Jira uses custom fields.
                        </p>
                        <Button
                          size="sm"
                          disabled={busy || !isAdmin}
                          onClick={handleSaveMappings}
                          className="h-8"
                        >
                          Save Mappings
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            {/* Third Row: Test & Validate - Full Width */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <RefreshCw className="h-4 w-4" />
                  Test & Validate Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4 space-y-3">
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Demo Ticket Title</Label>
                    <Input
                      value={demoTitle}
                      onChange={(e) => setDemoTitle(e.target.value)}
                      placeholder="Enter ticket title"
                      disabled={!isAdmin || busy}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Demo Ticket Description</Label>
                    <Textarea
                      value={demoDescription}
                      onChange={(e) => setDemoDescription(e.target.value)}
                      placeholder="Enter ticket description"
                      className="min-h-[60px] text-sm"
                      disabled={!isAdmin || busy}
                    />
                  </div>
                  <Button
                    onClick={handleDemoAction}
                    disabled={busy || !isAdmin}
                    className="w-full h-9"
                  >
                    Create Sample Ticket in Jira (Demo)
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs">Webhook Replay Event</Label>
                  <Select
                    value={selectedEvent}
                    onValueChange={setSelectedEvent}
                    disabled={webhookBusy}
                  >
                    <SelectTrigger className="h-9">
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
                    className="w-full h-9"
                  >
                    Replay Webhook (Demo)
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Recent Integration Activity Log
                  </Label>
                  <div className="rounded-md border bg-muted/30 h-[200px] overflow-y-auto">
                    {logs.length > 0 ? (
                      <div className="divide-y">
                        {logs.map((log) => (
                          <div key={log.id} className="p-2 text-xs">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-medium text-xs">
                                {log.action}
                              </span>
                              <span className="text-muted-foreground whitespace-nowrap text-[10px]">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {log.details && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                                  View JSON
                                </summary>
                                <pre className="mt-1 text-[10px] bg-background p-1.5 rounded border overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No activity log entries yet. Connect and run a test to
                        see activity.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Render new ServiceNow-specific design
  if (isServiceNow) {
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
                  ServiceNow Integration
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create and track incidents, changes, and service requests in
                  your ServiceNow instance.
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
                    onClick={handleConnectDemo}
                  >
                    Start OAuth Setup
                  </Button>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Sync incidents, change requests, and CMDB data with ServiceNow for
              end-to-end IT workflows.
            </p>

            {/* What this integration enables */}
            <Card>
              <CardHeader>
                <CardTitle>What this integration enables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                  <li>
                    Create ServiceNow incidents automatically from helpdesk
                    tickets
                  </li>
                  <li>
                    Create / update change requests for scheduled maintenance
                  </li>
                  <li>Sync incident and change statuses bi-directionally</li>
                  <li>
                    Read CMDB device and CI relationships for faster triage
                  </li>
                  <li>Attach logs and comments to ServiceNow records</li>
                  <li>
                    Trigger ServiceNow workflows from Helpdesk automations
                  </li>
                </ul>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Lyzr handles mapping, retries and audit logging
                    automatically.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Setup Steps */}
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
                      Option B — Alternative: Integration User + MID/API Token
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
                            Authenticate with ServiceNow admin credentials
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Login using your ServiceNow administrator account
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Grant the requested scopes
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Authorize Lyzr to access your ServiceNow instance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          4
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Integration active
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            You'll be redirected back and the integration will
                            be active
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-3">
                        OAuth is recommended for production — secure and
                        supports token rotation.
                      </p>
                      <Button
                        onClick={handleConnectDemo}
                        disabled={busy || !isAdmin}
                        className="w-full"
                      >
                        Start OAuth Setup
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="api-token" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="sn-url">ServiceNow Base URL</Label>
                        <Input
                          id="sn-url"
                          placeholder="https://your-instance.service-now.com"
                          value={servicenowApiTokenUrl}
                          onChange={(e) =>
                            setServicenowApiTokenUrl(e.target.value)
                          }
                          disabled={!isAdmin || busy}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sn-email">
                          Integration user (service account) email
                        </Label>
                        <Input
                          id="sn-email"
                          type="email"
                          placeholder="integration.user@company.com"
                          value={servicenowApiTokenEmail}
                          onChange={(e) =>
                            setServicenowApiTokenEmail(e.target.value)
                          }
                          disabled={!isAdmin || busy}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sn-token">
                          API token / password (masked)
                        </Label>
                        <Input
                          id="sn-token"
                          type="password"
                          placeholder="Enter your ServiceNow API token"
                          value={servicenowApiToken}
                          onChange={(e) =>
                            setServicenowApiToken(e.target.value)
                          }
                          disabled={!isAdmin || busy}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Generate an API token from your ServiceNow account
                          settings
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sn-scope">
                          Instance scope (optional)
                        </Label>
                        <Input
                          id="sn-scope"
                          placeholder="global"
                          value={servicenowInstanceScope}
                          onChange={(e) =>
                            setServicenowInstanceScope(e.target.value)
                          }
                          disabled={!isAdmin || busy}
                        />
                      </div>
                      <Button
                        onClick={handleServiceNowConnectApiToken}
                        disabled={
                          !isAdmin ||
                          busy ||
                          !servicenowApiTokenUrl ||
                          !servicenowApiTokenEmail ||
                          !servicenowApiToken
                        }
                        className="w-full"
                      >
                        Connect using API Token
                      </Button>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Use this if your org uses integration service accounts
                        or restricts external OAuth.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Capabilities & Quick Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Capabilities & Quick Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    "Create Incidents",
                    "Create Changes",
                    "CMDB Read",
                    "Two-way Sync",
                    "Webhooks",
                    "Attachments",
                  ].map((capability) => (
                    <Badge
                      key={capability}
                      variant={
                        integration.status === "connected"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {capability}
                    </Badge>
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <ArrowRightLeft className="h-3 w-3" />
                    Sync Direction:{" "}
                    {integration.status === "connected"
                      ? "Two-way"
                      : "Not configured"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security & Required Scopes */}
            <Collapsible open={securityOpen} onOpenChange={setSecurityOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security & Permissions
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          securityOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Required permissions/scopes:
                      </p>
                      <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground ml-2">
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            api.read
                          </code>
                          : read CMDB and incidents
                        </li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            api.write
                          </code>
                          : create/update incidents and change requests
                        </li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            webhooks.manage
                          </code>
                          : configure webhooks (if used)
                        </li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            attachment
                          </code>
                          : create attachments
                        </li>
                      </ul>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        We recommend using a dedicated integration service
                        account with the minimum required roles. Tokens are
                        stored encrypted.
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Automatic configuration handled by Lyzr */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Automatic Configuration Handled by Lyzr
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                  <li>Default ticket → incident mapping</li>
                  <li>Change request creation for maintenance windows</li>
                  <li>CMDB lookup to auto-fill affected CI</li>
                  <li>SLA, priority, and assignment suggestions</li>
                  <li>Retry logic and webhook validation</li>
                  <li>Audit logging for compliance</li>
                </ul>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    We auto-discover Projects / Assignment Groups during the
                    first sync.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Advanced settings — Field mapping */}
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
                        Advanced — Field Mapping
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          fieldMappingOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                    <CardDescription>
                      Modify field mappings for custom ServiceNow configurations
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
                            Assignment Group
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
                          <Label className="text-sm font-medium">CI</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            ticket.ci (auto-resolved from CMDB)
                          </p>
                        </div>
                        <Select
                          value={mappings.ci ?? "ticket.component"}
                          onValueChange={(value) =>
                            setMappings((prev) => ({ ...prev, ci: value }))
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
                            Category
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            ticket.category
                          </p>
                        </div>
                        <Select
                          value={mappings.category ?? "ticket.category"}
                          onValueChange={(value) =>
                            setMappings((prev) => ({
                              ...prev,
                              category: value,
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
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-3">
                        Defaults work for most customers. Only edit if you use
                        custom fields.
                      </p>
                      <Button
                        size="sm"
                        disabled={busy || !isAdmin}
                        onClick={handleSaveMappings}
                      >
                        Save mappings
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* CMDB Sync & Discovery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  CMDB Sync & Discovery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {integration.status === "connected" && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                    <div>
                      <p className="text-sm font-medium">Last CMDB sync</p>
                      <p className="text-xs text-muted-foreground">
                        {integration.lastTestAt
                          ? new Date(integration.lastTestAt).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      OK
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cmdb-sync">Auto-sync CMDB</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable automatic CMDB sync to improve triage and automated
                      routing.
                    </p>
                  </div>
                  <Switch
                    id="cmdb-sync"
                    checked={cmdbSyncEnabled}
                    onCheckedChange={setCmdbSyncEnabled}
                    disabled={!isAdmin || integration.status !== "connected"}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleCmdbDiscovery}
                  disabled={busy || !isAdmin}
                  className="w-full"
                >
                  Run CMDB Discovery (Demo)
                </Button>
              </CardContent>
            </Card>

            {/* Test & Validate Integration */}
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
                    <Label className="text-sm">Demo Incident Title</Label>
                    <Input
                      value={demoTitle}
                      onChange={(e) => setDemoTitle(e.target.value)}
                      placeholder="Enter incident title"
                      disabled={!isAdmin || busy}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Demo Incident Description</Label>
                    <Textarea
                      value={demoDescription}
                      onChange={(e) => setDemoDescription(e.target.value)}
                      placeholder="Enter incident description"
                      className="min-h-[80px]"
                      disabled={!isAdmin || busy}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Severity / Priority</Label>
                    <Select
                      value={demoSeverity}
                      onValueChange={setDemoSeverity}
                      disabled={!isAdmin || busy}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Critical</SelectItem>
                        <SelectItem value="2">2 - High</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleDemoAction}
                      disabled={busy || !isAdmin}
                      className="w-full"
                    >
                      Create Sample Incident in ServiceNow (Demo)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCreateServiceNowChange}
                      disabled={busy || !isAdmin}
                      className="w-full"
                    >
                      Create Sample Change Request (Demo)
                    </Button>
                  </div>
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
                              <div className="flex items-center gap-2">
                                {log.action.includes("error") ||
                                log.action.includes("fail") ? (
                                  <XCircle className="h-3 w-3 text-destructive" />
                                ) : log.action.includes("success") ||
                                  log.action.includes("connect") ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="font-medium">
                                  {log.action}
                                </span>
                              </div>
                              <span className="text-muted-foreground whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {log.details && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                                  View JSON details
                                </summary>
                                <pre className="mt-2 text-[10px] bg-background p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
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
            <div className="flex items-center justify-end gap-3 pt-2 border-t mb-6">
              {integration.status === "connected" && (
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={busy || !isAdmin}
                >
                  Disconnect Integration
                </Button>
              )}
              {integration.status !== "connected" && (
                <Button onClick={handleConnectDemo} disabled={busy || !isAdmin}>
                  Start OAuth Setup
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

  // Render new Okta-specific design
  if (isOkta) {
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
                  Okta Integration
                </h1>
                <p className="text-sm text-muted-foreground">
                  Provision users, manage access requests, and sync groups using
                  Okta.
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
                    onClick={handleConnectDemo}
                  >
                    Start OAuth / Connect
                  </Button>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Use Okta for automated user provisioning, group sync, and access
              lifecycle management.
            </p>

            {/* What this integration enables */}
            <Card>
              <CardHeader>
                <CardTitle>What this integration enables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                  <li>
                    Provision and de-provision users in Okta automatically from
                    access requests
                  </li>
                  <li>
                    Push group assignments and roles from the helpdesk to Okta
                  </li>
                  <li>Trigger automated provisioning workflows on approval</li>
                  <li>
                    Fetch user status, device posture, and MFA state for access
                    decisions
                  </li>
                  <li>
                    Support Just-In-Time (JIT) provisioning or full SCIM
                    provisioning
                  </li>
                  <li>
                    Replay Okta events (user.lifecycle, group.user_membership)
                    for demo and debugging
                  </li>
                </ul>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Lyzr handles mapping, retries and audit logging
                    automatically; you only need to provide minimal credentials.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Setup Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Steps (Required once)</CardTitle>
                <CardDescription>
                  Choose your preferred connection method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="api-token" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="api-token">
                      Option A — Recommended: SCIM / API Token (Provisioning)
                    </TabsTrigger>
                    <TabsTrigger value="oauth">
                      Option B — Alternative: OAuth / OIDC
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="api-token" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Create an Okta API token in your Okta Admin Console
                            (one-time)
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Navigate to Security → API → Tokens in your Okta
                            Admin Console
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Provide your Okta base URL and API token in the form
                            below
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Grant the token a dedicated integration user with
                            the minimum required permissions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          4
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Click Connect using API Token
                          </p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="okta-url">Okta Base URL</Label>
                        <Input
                          id="okta-url"
                          placeholder="https://your-company.okta.com"
                          value={oktaApiTokenUrl}
                          onChange={(e) => setOktaApiTokenUrl(e.target.value)}
                          disabled={!isAdmin || busy}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="okta-token">API token</Label>
                        <Input
                          id="okta-token"
                          type="password"
                          placeholder="Enter your Okta API token"
                          value={oktaApiToken}
                          onChange={(e) => setOktaApiToken(e.target.value)}
                          disabled={!isAdmin || busy}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Generate an API token from Security → API → Tokens in
                          Okta Admin Console
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="okta-integration-user">
                          Integration user (optional)
                        </Label>
                        <Input
                          id="okta-integration-user"
                          placeholder="integration.user@company.com"
                          value={oktaIntegrationUser}
                          onChange={(e) =>
                            setOktaIntegrationUser(e.target.value)
                          }
                          disabled={!isAdmin || busy}
                        />
                      </div>
                      <Button
                        onClick={handleOktaConnectApiToken}
                        disabled={
                          !isAdmin || busy || !oktaApiTokenUrl || !oktaApiToken
                        }
                        className="w-full"
                      >
                        Connect using API Token
                      </Button>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        SCIM/API token is recommended for provisioning because
                        it allows granular provisioning and de-provisioning
                        control.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="oauth" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Click Start OAuth (opens Okta OAuth/OIDC flow)
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use the button in the header above or below
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Sign in with an Okta admin account and grant
                            read/event scopes
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Authorize Lyzr to access your Okta instance
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-3">
                        Use OAuth if you prefer delegated access without storing
                        tokens.
                      </p>
                      <Button
                        onClick={handleConnectDemo}
                        disabled={busy || !isAdmin}
                        className="w-full"
                      >
                        Start OAuth
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Quick Capabilities & Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Capabilities & Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    "Provisioning (SCIM)",
                    "Group Sync",
                    "Read user state",
                    "Event Hooks",
                    "MFA info",
                    "De-provisioning",
                  ].map((capability) => (
                    <Badge
                      key={capability}
                      variant={
                        integration.status === "connected"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {capability}
                    </Badge>
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <ArrowRightLeft className="h-3 w-3" />
                    Sync Direction:{" "}
                    {integration.status === "connected"
                      ? "Push provisioning (Lyzr → Okta) and Read-only fetch (Okta → Lyzr)"
                      : "Not configured"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Minimal client work */}
            <Card>
              <CardHeader>
                <CardTitle>Minimum required from your side</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">
                      Create Okta API token OR start OAuth flow
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">
                      Provide a dedicated integration service account
                      (recommended)
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">
                      Allow SCIM provisioning and group management to the token
                      user
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    We will handle mapping, scheduling, and retries. If you
                    want, we can do field mapping and onboarding during the POC.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security & Required Scopes */}
            <Collapsible open={securityOpen} onOpenChange={setSecurityOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security & Required Scopes
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          securityOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Required scopes / permissions:
                      </p>
                      <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground ml-2">
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            okta.users.manage
                          </code>
                          : create/update users for provisioning via API
                        </li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            okta.groups.manage
                          </code>
                          : manage group memberships
                        </li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            okta.events.read
                          </code>
                          : read events for webhook replay
                        </li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            okta.apps.read
                          </code>
                          : optional, for app assignment checks
                        </li>
                      </ul>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        We recommend a dedicated integration service account.
                        Tokens are stored encrypted in the Lyzr backend.
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Provisioning Settings */}
            <Collapsible
              open={provisioningSettingsOpen}
              onOpenChange={setProvisioningSettingsOpen}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Provisioning & Group Sync
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          provisioningSettingsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                    <CardDescription>
                      Configure user provisioning and group synchronization
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-provisioning">
                          Enable provisioning
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Allow automatic user provisioning to Okta
                        </p>
                      </div>
                      <Switch
                        id="enable-provisioning"
                        checked={provisioningEnabled}
                        onCheckedChange={setProvisioningEnabled}
                        disabled={
                          !isAdmin || integration.status !== "connected"
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-group-sync">
                          Enable group sync
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Sync group memberships between Lyzr and Okta
                        </p>
                      </div>
                      <Switch
                        id="enable-group-sync"
                        checked={groupSyncEnabled}
                        onCheckedChange={setGroupSyncEnabled}
                        disabled={
                          !isAdmin || integration.status !== "connected"
                        }
                      />
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <p className="text-sm font-medium">Field Mapping</p>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4 items-center">
                          <div>
                            <Label className="text-sm">Username</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              ticket.requester.email
                            </p>
                          </div>
                          <Select disabled={!isAdmin}>
                            <SelectTrigger>
                              <SelectValue value="ticket.requester.email" />
                            </SelectTrigger>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                          <div>
                            <Label className="text-sm">First name</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              ticket.requester.firstName
                            </p>
                          </div>
                          <Select disabled={!isAdmin}>
                            <SelectTrigger>
                              <SelectValue value="ticket.requester.firstName" />
                            </SelectTrigger>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                          <div>
                            <Label className="text-sm">Last name</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              ticket.requester.lastName
                            </p>
                          </div>
                          <Select disabled={!isAdmin}>
                            <SelectTrigger>
                              <SelectValue value="ticket.requester.lastName" />
                            </SelectTrigger>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                          <div>
                            <Label className="text-sm">Groups</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              requested_role / project_group
                            </p>
                          </div>
                          <Select disabled={!isAdmin}>
                            <SelectTrigger>
                              <SelectValue value="requested_role" />
                            </SelectTrigger>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto-approve"
                        checked={autoApproveLowRisk}
                        onChange={(e) =>
                          setAutoApproveLowRisk(e.target.checked)
                        }
                        disabled={!isAdmin}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="auto-approve" className="text-sm">
                        Auto-approve low-risk requests
                      </Label>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-3">
                        By default, provisioning is disabled; enable only when
                        ready.
                      </p>
                      <Button
                        size="sm"
                        disabled={busy || !isAdmin}
                        onClick={handleSaveProvisioningSettings}
                      >
                        Save provisioning settings
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Event Hooks & Webhooks */}
            <Collapsible open={eventHooksOpen} onOpenChange={setEventHooksOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Webhook className="h-4 w-4" />
                        Event Hooks
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          eventHooksOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                    <CardDescription>
                      Configure Okta event hooks for real-time event delivery
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-sm text-muted-foreground">
                      Okta event hooks allow us to receive real-time Okta events
                      (user.lifecycle, group.user_membership).
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="event-hook-url">
                        Okta event hook URL (optional)
                      </Label>
                      <Input
                        id="event-hook-url"
                        placeholder="https://your-instance.lyzr.ai/webhooks/okta"
                        value={oktaEventHookUrl}
                        onChange={(e) => setOktaEventHookUrl(e.target.value)}
                        disabled={!isAdmin || busy}
                      />
                      <p className="text-xs text-muted-foreground">
                        If you cannot register event hooks, periodic polling
                        will be used.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleRegisterEventHook}
                      disabled={busy || !isAdmin}
                      className="w-full"
                    >
                      Register Event Hook (Demo)
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Test & Validate Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Test & Validate Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Demo user email</Label>
                      <Input
                        value={demoUserEmail}
                        onChange={(e) => setDemoUserEmail(e.target.value)}
                        placeholder="demo.user@company.com"
                        disabled={!isAdmin || busy}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Group to assign</Label>
                      <Select
                        value={demoUserGroup}
                        onValueChange={setDemoUserGroup}
                        disabled={!isAdmin || busy}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="github-admins">
                            github-admins
                          </SelectItem>
                          <SelectItem value="developers">developers</SelectItem>
                          <SelectItem value="it-support">it-support</SelectItem>
                          <SelectItem value="managers">managers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">First name</Label>
                      <Input
                        value={demoUserFirstName}
                        onChange={(e) => setDemoUserFirstName(e.target.value)}
                        placeholder="Demo"
                        disabled={!isAdmin || busy}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Last name</Label>
                      <Input
                        value={demoUserLastName}
                        onChange={(e) => setDemoUserLastName(e.target.value)}
                        placeholder="User"
                        disabled={!isAdmin || busy}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={handleDemoAction}
                      disabled={busy || !isAdmin}
                      className="w-full"
                    >
                      Create Sample User in Okta (Demo)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAssignOktaGroup}
                      disabled={busy || !isAdmin}
                      className="w-full"
                    >
                      Assign Group (Demo)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeactivateOktaUser}
                      disabled={busy || !isAdmin}
                      className="w-full"
                    >
                      Deactivate Sample User (Demo)
                    </Button>
                  </div>
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
                    Replay Event (Demo)
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
                              <div className="flex items-center gap-2">
                                {log.action.includes("error") ||
                                log.action.includes("fail") ? (
                                  <XCircle className="h-3 w-3 text-destructive" />
                                ) : log.action.includes("success") ||
                                  log.action.includes("connect") ||
                                  log.action.includes("provision") ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="font-medium">
                                  {log.action}
                                </span>
                              </div>
                              <span className="text-muted-foreground whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {log.details && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                                  View JSON details
                                </summary>
                                <pre className="mt-2 text-[10px] bg-background p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
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
            <div className="flex items-center justify-end gap-3 pt-2 border-t mb-6">
              {integration.status === "connected" && (
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={busy || !isAdmin}
                >
                  Disconnect Integration
                </Button>
              )}
              {integration.status !== "connected" && (
                <Button onClick={handleConnectDemo} disabled={busy || !isAdmin}>
                  Connect / Start OAuth
                </Button>
              )}
              <Button
                onClick={handleSaveProvisioningSettings}
                disabled={busy || !isAdmin}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Render new Google Workspace-specific design
  if (isGoogle) {
    const filteredLogs =
      activityLogFilter === "all"
        ? logs
        : logs.filter((log) =>
            log.action.toLowerCase().includes(activityLogFilter)
          );

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
                  Google Workspace Admin
                </h1>
                <p className="text-sm text-muted-foreground">
                  Fetch users, devices and account posture from Google Workspace
                  for access decisions and user lifecycle management.
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
                    onClick={handleConnectDemo}
                  >
                    Start OAuth Setup
                  </Button>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Use Workspace Admin APIs to read user accounts, device posture,
              group membership and to support access workflows.
            </p>

            {/* What this integration enables */}
            <Card>
              <CardHeader>
                <CardTitle>What this integration enables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                  <li>
                    Read user accounts and group membership for access decisions
                  </li>
                  <li>
                    Check device posture (managed device, last sync, OS) to
                    enforce conditional access
                  </li>
                  <li>
                    Suspend/restore users as part of de-provisioning (optional)
                  </li>
                  <li>Map Google groups to role assignments or app access</li>
                  <li>Fetch MFA/enrollment state for risk-aware approvals</li>
                  <li>Replay Workspace admin events for demo and debugging</li>
                </ul>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Lyzr only requests the scopes needed to support access and
                    lifecycle flows.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Setup Steps */}
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
                      Option A — Recommended: OAuth Consent
                    </TabsTrigger>
                    <TabsTrigger value="service-account">
                      Option B — Alternative: Service Account
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
                            Use the button in the header above
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Sign in with a Google Workspace admin account
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Authenticate using your Google Workspace
                            administrator credentials
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Grant the requested admin scopes (read users, read
                            groups, device management)
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Authorize Lyzr to access your Google Workspace
                            instance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                          4
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Integration active
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            You'll be redirected back and the integration will
                            be active
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-3">
                        OAuth is simplest for most customers and supports token
                        rotation.
                      </p>
                      <Button
                        onClick={handleConnectDemo}
                        disabled={busy || !isAdmin}
                        className="w-full"
                      >
                        Start OAuth Setup
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent
                    value="service-account"
                    className="space-y-4 mt-4"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="service-account-json">
                          Service account JSON
                        </Label>
                        <Textarea
                          id="service-account-json"
                          placeholder="Paste your service account JSON here (or upload file)"
                          value={googleServiceAccountJson}
                          onChange={(e) =>
                            setGoogleServiceAccountJson(e.target.value)
                          }
                          disabled={!isAdmin || busy}
                          className="min-h-[120px] font-mono text-xs"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload or paste the JSON key file from your Google
                          service account
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="domain-name">
                          Customer / Domain name
                        </Label>
                        <Input
                          id="domain-name"
                          placeholder="example.com"
                          value={googleDomainName}
                          onChange={(e) => setGoogleDomainName(e.target.value)}
                          disabled={!isAdmin || busy}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Delegate scopes (recommended)</Label>
                        <div className="space-y-2 pl-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="scope-users-read"
                              defaultChecked
                              className="h-4 w-4"
                              disabled={!isAdmin}
                            />
                            <Label
                              htmlFor="scope-users-read"
                              className="text-xs font-normal cursor-pointer"
                            >
                              admin.directory.user.readonly
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="scope-groups-read"
                              defaultChecked
                              className="h-4 w-4"
                              disabled={!isAdmin}
                            />
                            <Label
                              htmlFor="scope-groups-read"
                              className="text-xs font-normal cursor-pointer"
                            >
                              admin.directory.group.readonly
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="scope-audit-read"
                              defaultChecked
                              className="h-4 w-4"
                              disabled={!isAdmin}
                            />
                            <Label
                              htmlFor="scope-audit-read"
                              className="text-xs font-normal cursor-pointer"
                            >
                              admin.reports.audit.readonly
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="scope-device-read"
                              defaultChecked
                              className="h-4 w-4"
                              disabled={!isAdmin}
                            />
                            <Label
                              htmlFor="scope-device-read"
                              className="text-xs font-normal cursor-pointer"
                            >
                              admin.directory.device.chromeos.readonly
                            </Label>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleGoogleConnectServiceAccount}
                        disabled={
                          !isAdmin ||
                          busy ||
                          !googleServiceAccountJson ||
                          !googleDomainName
                        }
                        className="w-full"
                      >
                        Connect using Service Account
                      </Button>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Use service accounts when domain-wide delegation is
                        required by policy.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Minimal customer work */}
            <Card>
              <CardHeader>
                <CardTitle>Minimum required from your side</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">
                      Google Workspace admin account for one-time OAuth OR
                      service account + domain delegation file
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">(Optional) List of groups to map</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">
                      (Optional) Approver(s) for provisioning workflows
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    We will handle mapping, scheduling, retries and storage of
                    tokens.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security & Required Scopes */}
            <Collapsible open={securityOpen} onOpenChange={setSecurityOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security & Required Scopes
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          securityOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Required scopes:</p>
                      <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground ml-2">
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            https://www.googleapis.com/auth/admin.directory.user.readonly
                          </code>{" "}
                          (read users)
                        </li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            https://www.googleapis.com/auth/admin.directory.group.readonly
                          </code>{" "}
                          (read groups)
                        </li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            https://www.googleapis.com/auth/admin.reports.audit.readonly
                          </code>{" "}
                          (audit/events)
                        </li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            https://www.googleapis.com/auth/admin.directory.user
                          </code>{" "}
                          (optional — create/suspend users)
                        </li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            https://www.googleapis.com/auth/admin.directory.device.chromeos.readonly
                          </code>{" "}
                          (device posture)
                        </li>
                      </ul>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        We recommend a dedicated integration account. Tokens and
                        keys are stored encrypted. Use domain-wide delegation
                        only if required.
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Capabilities & Quick Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Capabilities & Quick Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    "Read users",
                    "Group sync",
                    "Device posture",
                    "MFA state",
                    "Suspend users (optional)",
                    "Webhook/event replay",
                  ].map((capability) => (
                    <Badge
                      key={capability}
                      variant={
                        integration.status === "connected"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {capability}
                    </Badge>
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Current sync behavior:{" "}
                    {integration.status === "connected"
                      ? "Polling interval: 15 minutes"
                      : "Not configured"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Device Posture & Risk */}
            <Card>
              <CardHeader>
                <CardTitle>Device Posture & Risk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use device posture to block or require approvals for risky
                  access.
                </p>
                {integration.status === "connected" ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Managed devices
                      </p>
                      <p className="text-2xl font-semibold">124</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Unmanaged devices
                      </p>
                      <p className="text-2xl font-semibold">8</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Avg last sync
                      </p>
                      <p className="text-sm font-medium">2h ago</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Outdated OS
                      </p>
                      <p className="text-2xl font-semibold">3</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                    Connect to view device posture data
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-device-posture">
                      Enable device posture checks
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Use device status for access decisions
                    </p>
                  </div>
                  <Switch
                    id="enable-device-posture"
                    checked={devicePostureEnabled}
                    onCheckedChange={setDevicePostureEnabled}
                    disabled={!isAdmin || integration.status !== "connected"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="posture-policy">Posture policy mapping</Label>
                  <Select
                    value={posturePolicy}
                    onValueChange={setPosturePolicy}
                    disabled={!isAdmin || !devicePostureEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="require-approval">
                        Require approval
                      </SelectItem>
                      <SelectItem value="allow">Allow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={handleRunDeviceSync}
                  disabled={busy || !isAdmin}
                  className="w-full"
                >
                  Run Device Sync (Demo)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Device posture requires the device APIs to be accessible in
                  your Workspace Admin console.
                </p>
              </CardContent>
            </Card>

            {/* Group Mapping & Provisioning */}
            <Collapsible
              open={groupMappingOpen}
              onOpenChange={setGroupMappingOpen}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Group Mapping & Provisioning
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          groupMappingOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                    <CardDescription>
                      Map Google Groups to Lyzr roles and configure provisioning
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-group-sync-google">
                          Enable group sync
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Sync group memberships between Google Workspace and
                          Lyzr
                        </p>
                      </div>
                      <Switch
                        id="enable-group-sync-google"
                        checked={groupSyncEnabledGoogle}
                        onCheckedChange={setGroupSyncEnabledGoogle}
                        disabled={
                          !isAdmin || integration.status !== "connected"
                        }
                      />
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Map Google Group → Lyzr Role / Ticket assignment
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAutoDiscoverGroups}
                          disabled={busy || !isAdmin}
                        >
                          Auto-discover groups (Demo)
                        </Button>
                      </div>
                      <div className="rounded-md border">
                        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 text-xs font-medium border-b">
                          <div>Google Group</div>
                          <div>Lyzr Role</div>
                          <div>Ticket Assignment</div>
                        </div>
                        <div className="divide-y">
                          {[
                            {
                              group: "developers@company.com",
                              role: "Developer",
                              assignment: "Engineering Team",
                            },
                            {
                              group: "managers@company.com",
                              role: "Manager",
                              assignment: "Management",
                            },
                          ].map((mapping, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-3 gap-4 p-3 text-xs"
                            >
                              <div>{mapping.group}</div>
                              <div>{mapping.role}</div>
                              <div>{mapping.assignment}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto-provision"
                        checked={autoProvisionUsers}
                        onChange={(e) =>
                          setAutoProvisionUsers(e.target.checked)
                        }
                        disabled={!isAdmin}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="auto-provision" className="text-sm">
                        Auto-provision users into mapped groups after approval
                      </Label>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Defaults are safe; modify only if you use custom group
                        naming.
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Test & Validate Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Test & Validate Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Email</Label>
                      <Input
                        value={demoGoogleEmail}
                        onChange={(e) => setDemoGoogleEmail(e.target.value)}
                        placeholder="demo.user@company.com"
                        disabled={!isAdmin || busy}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Group to check</Label>
                      <Select
                        value={demoGoogleGroup}
                        onValueChange={setDemoGoogleGroup}
                        disabled={!isAdmin || busy}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="developers">developers</SelectItem>
                          <SelectItem value="managers">managers</SelectItem>
                          <SelectItem value="it-support">it-support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleFetchGoogleUser}
                      disabled={busy || !isAdmin}
                      className="w-full"
                    >
                      Fetch User (Demo)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleFetchGoogleGroups}
                      disabled={busy || !isAdmin}
                      className="w-full"
                    >
                      Fetch Groups (Demo)
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSuspendRestoreGoogleUser}
                      disabled={busy || !isAdmin}
                      className="w-full"
                    >
                      Suspend / Restore User (Demo)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRunDeviceSync}
                      disabled={busy || !isAdmin}
                      className="w-full"
                    >
                      Run Device Sync (Demo)
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm">Webhook / Event Replay</Label>
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
                    Replay Event (Demo)
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Recent Integration Activity Log
                    </Label>
                    <Select
                      value={activityLogFilter}
                      onValueChange={setActivityLogFilter}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All events</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="device">Device</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-md border bg-muted/30 max-h-[300px] overflow-y-auto">
                    {filteredLogs.length > 0 ? (
                      <div className="divide-y">
                        {filteredLogs.map((log) => (
                          <div key={log.id} className="p-3 text-xs">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                {log.action.includes("error") ||
                                log.action.includes("fail") ? (
                                  <XCircle className="h-3 w-3 text-destructive" />
                                ) : log.action.includes("success") ||
                                  log.action.includes("connect") ||
                                  log.action.includes("fetch") ||
                                  log.action.includes("sync") ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="font-medium">
                                  {log.action}
                                </span>
                              </div>
                              <span className="text-muted-foreground whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {log.details && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                                  View JSON details
                                </summary>
                                <pre className="mt-2 text-[10px] bg-background p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
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
            <div className="flex items-center justify-end gap-3 pt-2 border-t mb-6">
              {integration.status === "connected" && (
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={busy || !isAdmin}
                >
                  Disconnect Integration
                </Button>
              )}
              {integration.status !== "connected" && (
                <Button onClick={handleConnectDemo} disabled={busy || !isAdmin}>
                  Start OAuth Setup
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
