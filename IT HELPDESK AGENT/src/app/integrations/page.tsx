"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useAdminMode } from "@/contexts/admin-mode-context"
import type { IntegrationConfig } from "@/lib/integrations-types"
import {
  connectIntegrationApi,
  disconnectIntegrationApi,
  fetchIntegrations,
  testIntegrationApi,
} from "@/lib/integrations-api"

function statusVariant(integration: IntegrationConfig): "default" | "secondary" | "outline" {
  if (integration.status === "connected" && integration.mode === "demo") {
    return "secondary"
  }
  if (integration.status === "connected") {
    return "default"
  }
  return "outline"
}

function statusLabel(integration: IntegrationConfig): string {
  if (integration.status === "connected" && integration.mode === "demo") {
    return "Demo connected"
  }
  if (integration.status === "connected") {
    return "Connected"
  }
  return "Not connected"
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(true)
  const [busyProvider, setBusyProvider] = useState<string | null>(null)
  const { isAdmin } = useAdminMode()
  const router = useRouter()

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchIntegrations()
        setIntegrations(data)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load integrations")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleConnect = async (provider: IntegrationConfig["meta"]["id"]) => {
    if (!isAdmin) return
    setBusyProvider(provider)
    try {
      const mode = demoMode ? "demo" : "real"
      const res = await connectIntegrationApi(provider, { mode })
      toast.success(
        provider === "jira"
          ? `Connected Jira (${mode === "demo" ? "Demo" : "Real"})`
          : "Integration connected (demo)",
      )
      setIntegrations((prev) =>
        prev.map((i) =>
          i.meta.id === provider
            ? {
                ...i,
                status: "connected",
                mode: mode === "demo" ? "demo" : "real",
              }
            : i,
        ),
      )
      if ("sample_issue" in res || "sample_incident" in res) {
        // no-op; response is primarily for demo payloads
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to connect integration")
    } finally {
      setBusyProvider(null)
    }
  }

  const handleDisconnect = async (provider: IntegrationConfig["meta"]["id"]) => {
    if (!isAdmin) return
    setBusyProvider(provider)
    try {
      await disconnectIntegrationApi(provider)
      toast.success("Integration disconnected")
      setIntegrations((prev) =>
        prev.map((i) =>
          i.meta.id === provider
            ? {
                ...i,
                status: "disconnected",
                maskedToken: undefined,
                connectedAt: undefined,
              }
            : i,
        ),
      )
    } catch (error) {
      console.error(error)
      toast.error("Failed to disconnect integration")
    } finally {
      setBusyProvider(null)
    }
  }

  const handleTest = async (provider: IntegrationConfig["meta"]["id"]) => {
    setBusyProvider(provider)
    try {
      const res = await testIntegrationApi(provider)
      const message =
        (res as { message?: string }).message ??
        "Test executed successfully (demo)"
      toast.success(message)
    } catch (error) {
      console.error(error)
      toast.error("Test failed")
    } finally {
      setBusyProvider(null)
    }
  }

  const primaryActionLabel = (integration: IntegrationConfig): string => {
    if (integration.status === "connected") {
      return "Disconnect"
    }
    return "Connect"
  }

  const handlePrimaryAction = (integration: IntegrationConfig) => {
    if (!isAdmin) {
      router.push(`/integrations/${integration.meta.id}`)
      return
    }
    if (integration.status === "connected") {
      void handleDisconnect(integration.meta.id)
    } else {
      void handleConnect(integration.meta.id)
    }
  }

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen overflow-auto">
        <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Integrations
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect Jira, ServiceNow, Okta, and Google Workspace Admin for end-to-end IT workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Demo Mode</span>
          <Switch
            checked={demoMode}
            onCheckedChange={setDemoMode}
            aria-label="Toggle demo mode"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading integrations...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {integrations.map((integration) => (
            <Card
              key={integration.meta.id}
              className="flex flex-col justify-between"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{integration.meta.name}</span>
                  <Badge variant={statusVariant(integration)}>
                    {statusLabel(integration)}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {integration.meta.description}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    variant={
                      integration.status === "connected" ? "outline" : "default"
                    }
                    disabled={busyProvider === integration.meta.id || !isAdmin}
                    onClick={() => handlePrimaryAction(integration)}
                  >
                    {isAdmin
                      ? primaryActionLabel(integration)
                      : "View"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyProvider === integration.meta.id}
                    onClick={() =>
                      router.push(`/integrations/${integration.meta.id}`)
                    }
                  >
                    Details
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    disabled={busyProvider === integration.meta.id}
                    onClick={() => void handleTest(integration.meta.id)}
                    className="text-xs"
                  >
                    Test connection
                  </Button>
                  {integration.meta.id === "jira" && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        router.push("/integrations/jira")
                      }
                    >
                      Create demo ticket
                    </Button>
                  )}
                  {integration.meta.id === "servicenow" && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        router.push("/integrations/servicenow")
                      }
                    >
                      Create incident
                    </Button>
                  )}
                  {integration.meta.id === "okta" && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        router.push("/integrations/okta")
                      }
                    >
                      Run provisioning
                    </Button>
                  )}
                  {integration.meta.id === "google" && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        router.push("/integrations/google")
                      }
                    >
                      Fetch user / device
                    </Button>
                  )}
                </div>
                {!isAdmin && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Admin-only actions are hidden. Enable Admin Mode in the sidebar to manage connections.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


