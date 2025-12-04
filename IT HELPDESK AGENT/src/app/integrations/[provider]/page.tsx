"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAdminMode } from "@/contexts/admin-mode-context"
import type { AuditLogEntry, IntegrationConfig, IntegrationProvider } from "@/lib/integrations-types"
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
} from "@/lib/integrations-api"
import { describeWebhookEvent } from "@/lib/integration-webhook-utils"

type ProviderParam = IntegrationProvider

const LOCAL_FIELDS = [
  "ticket.title",
  "ticket.description",
  "ticket.priority",
  "ticket.assignee",
  "ticket.component",
]

const DEMO_EVENTS: Record<IntegrationProvider, { id: string; label: string }[]> = {
  jira: [{ id: "jira.ticket.updated", label: "jira.ticket.updated" }],
  servicenow: [{ id: "servicenow.incident.resolved", label: "servicenow.incident.resolved" }],
  okta: [{ id: "okta.user.provisioned", label: "okta.user.provisioned" }],
  google: [{ id: "google.device.offline", label: "google.device.offline" }],
}

export default function IntegrationDetailPage() {
  const { provider } = useParams<{ provider: ProviderParam }>()
  const [integration, setIntegration] = useState<IntegrationConfig | null>(null)
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [webhookBusy, setWebhookBusy] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | undefined>(
    DEMO_EVENTS[provider]?.[0]?.id,
  )
  const [demoTitle, setDemoTitle] = useState("VPN disconnecting")
  const [demoDescription, setDemoDescription] = useState(
    "User reports frequent VPN disconnects while working from home.",
  )
  const { isAdmin } = useAdminMode()

  useEffect(() => {
    void (async () => {
      try {
        const all = await fetchIntegrations()
        const current = all.find((i) => i.meta.id === provider) ?? null
        setIntegration(current)
        const [m, l] = await Promise.all([
          fetchIntegrationMapping(provider),
          fetchIntegrationLogs(provider, 5),
        ])
        setMappings(m)
        setLogs(l)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load integration details")
      } finally {
        setLoading(false)
      }
    })()
  }, [provider])

  const handleConnectDemo = async () => {
    if (!isAdmin) return
    setBusy(true)
    try {
      const res = await connectIntegrationApi(provider, { mode: "demo" })
      toast.success("Connected in demo mode")
      setIntegration(
        (prev) =>
          prev && {
            ...prev,
            status: "connected",
            mode: "demo",
            maskedToken:
              (res as { masked_token?: string }).masked_token ??
              prev.maskedToken,
          },
      )
    } catch (error) {
      console.error(error)
      toast.error("Failed to connect (demo)")
    } finally {
      setBusy(false)
    }
  }

  const handleJiraRealOAuth = async () => {
    if (!isAdmin || provider !== "jira") return
    setBusy(true)
    try {
      const res = await startJiraOAuth()
      if (!res.success || !res.authorizeUrl) {
        toast.error(res.message ?? "Jira OAuth not configured")
        return
      }
      window.location.href = res.authorizeUrl
    } catch (error) {
      console.error(error)
      toast.error("Failed to start Jira OAuth")
    } finally {
      setBusy(false)
    }
  }

  const handleDisconnect = async () => {
    if (!isAdmin) return
    setBusy(true)
    try {
      await disconnectIntegrationApi(provider)
      toast.success("Integration disconnected")
      setIntegration(
        (prev) =>
          prev && {
            ...prev,
            status: "disconnected",
            maskedToken: undefined,
            connectedAt: undefined,
          },
      )
    } catch (error) {
      console.error(error)
      toast.error("Failed to disconnect")
    } finally {
      setBusy(false)
    }
  }

  const handleSaveMappings = async () => {
    if (!isAdmin) return
    setBusy(true)
    try {
      const next = await saveIntegrationMapping(provider, mappings)
      setMappings(next)
      toast.success("Mappings saved")
    } catch (error) {
      console.error(error)
      toast.error("Failed to save mappings")
    } finally {
      setBusy(false)
    }
  }

  const handleTest = async () => {
    setBusy(true)
    try {
      const res = await testIntegrationApi(provider)
      const message =
        (res as { message?: string }).message ??
        "Test executed successfully (demo)"
      toast.success(message)
      const latest = await fetchIntegrationLogs(provider, 5)
      setLogs(latest)
    } catch (error) {
      console.error(error)
      toast.error("Test failed")
    } finally {
      setBusy(false)
    }
  }

  const handleWebhookReplay = async () => {
    if (!selectedEvent) return
    setWebhookBusy(true)
    try {
      const res = await replayWebhook({
        provider,
        sampleEventId: selectedEvent,
      })
      if (!res.success) {
        toast.error("Webhook replay failed")
        return
      }
      const description = describeWebhookEvent(
        res.event as unknown as any,
      )
      toast.success(description)
      const latest = await fetchIntegrationLogs(provider, 5)
      setLogs(latest)
    } catch (error) {
      console.error(error)
      toast.error("Webhook replay failed")
    } finally {
      setWebhookBusy(false)
    }
  }

  const handleDemoAction = async () => {
    if (!isAdmin) return
    setBusy(true)
    try {
      if (provider === "jira") {
        const res = await createDemoJiraIssue({
          title: demoTitle,
          description: demoDescription,
          priority: "high",
          assignee: "demo.user",
        })
        toast.success(
          `Created external ticket ${res.external_id} (Demo)`,
        )
      } else if (provider === "servicenow") {
        const res = await createDemoServiceNowIncident({
          title: demoTitle,
          description: demoDescription,
        })
        toast.success(
          `Created ServiceNow incident ${res.external_id} (Demo)`,
        )
      } else if (provider === "okta") {
        const res = await demoOktaProvision({
          username: "demo.user@company.com",
          groups: ["github-admins"],
          duration: "30 days",
        })
        toast.success(
          `Provisioning started ${res.external_id} (Demo)`,
        )
      } else if (provider === "google") {
        const res = await demoGoogleCheckDevice()
        toast.success(
          `Device status: ${res.device_status}, OS ${res.os}`,
        )
      }
      const latest = await fetchIntegrationLogs(provider, 5)
      setLogs(latest)
    } catch (error) {
      console.error(error)
      toast.error("Demo action failed")
    } finally {
      setBusy(false)
    }
  }

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
    )
  }

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
          {provider === "jira" && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy || !isAdmin}
              onClick={handleJiraRealOAuth}
              className="text-xs"
            >
              Start real OAuth (Jira)
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Field Mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["title", "description", "priority", "assignee", "project"].map(
              (key) => (
                <div
                  key={key}
                  className="grid grid-cols-2 gap-2 items-center"
                >
                  <div>
                    <Label className="text-xs capitalize">
                      {key}
                    </Label>
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
              ),
            )}
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
            {(provider === "jira" || provider === "servicenow") && (
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
                  onChange={(e) =>
                    setDemoDescription(e.target.value)
                  }
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
              {provider === "jira" && "Create external ticket (Demo)"}
              {provider === "servicenow" && "Create incident (Demo)"}
              {provider === "okta" && "Provision user (Demo)"}
              {provider === "google" && "Check device (Demo)"}
            </Button>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  Webhook replay
                </span>
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
                This simulates an incoming webhook and shows how the
                agent or dashboard would react.
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
                  <div
                    key={log.id}
                    className="rounded-md border px-2 py-1"
                  >
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
                    No audit log entries yet. Connect and run a test to
                    see activity.
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
  )
}


