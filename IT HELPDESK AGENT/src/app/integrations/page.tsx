"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
import { toast } from "sonner";
import { useAdminMode } from "@/contexts/admin-mode-context";
import type {
  IntegrationConfig,
  IntegrationProvider,
} from "@/lib/integrations-types";
import {
  connectIntegrationApi,
  disconnectIntegrationApi,
  fetchIntegrations,
  testIntegrationApi,
} from "@/lib/integrations-api";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { ConnectModal } from "@/components/integrations/connect-modal";
import { SetupGuidePanel } from "@/components/integrations/setup-guide-panel";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [connectModalProvider, setConnectModalProvider] =
    useState<IntegrationProvider | null>(null);
  const [setupGuideOpen, setSetupGuideOpen] = useState(false);
  const [setupGuideProvider, setSetupGuideProvider] =
    useState<IntegrationProvider | null>(null);
  const [disconnectProvider, setDisconnectProvider] =
    useState<IntegrationProvider | null>(null);
  const { isAdmin } = useAdminMode();
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchIntegrations();
        setIntegrations(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load integrations");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleConnect = async (provider: IntegrationConfig["meta"]["id"]) => {
    if (!isAdmin) return;
    setBusyProvider(provider);
    try {
      const mode = demoMode ? "demo" : "real";
      const res = await connectIntegrationApi(provider, { mode });
      toast.success(
        provider === "jira"
          ? `Connected Jira (${mode === "demo" ? "Demo" : "Real"})`
          : "Integration connected (demo)"
      );
      setIntegrations((prev) =>
        prev.map((i) =>
          i.meta.id === provider
            ? {
                ...i,
                status: "connected",
                mode: mode === "demo" ? "demo" : "real",
              }
            : i
        )
      );
      if ("sample_issue" in res || "sample_incident" in res) {
        // no-op; response is primarily for demo payloads
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect integration");
    } finally {
      setBusyProvider(null);
    }
  };

  const handleDisconnect = async (
    provider: IntegrationConfig["meta"]["id"]
  ) => {
    if (!isAdmin) return;
    setBusyProvider(provider);
    try {
      await disconnectIntegrationApi(provider);
      toast.success("Integration disconnected");
      setIntegrations((prev) =>
        prev.map((i) =>
          i.meta.id === provider
            ? {
                ...i,
                status: "disconnected",
                maskedToken: undefined,
                connectedAt: undefined,
              }
            : i
        )
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to disconnect integration");
    } finally {
      setBusyProvider(null);
    }
  };

  const handleTest = async (provider: IntegrationProvider) => {
    setBusyProvider(provider);
    try {
      const res = await testIntegrationApi(provider);
      const message =
        (res as { message?: string }).message ??
        "Test executed successfully (demo)";
      toast.success(message);
    } catch (error) {
      console.error(error);
      toast.error("Test failed");
    } finally {
      setBusyProvider(null);
    }
  };

  const handleOpenConnectModal = (provider: IntegrationProvider) => {
    setConnectModalProvider(provider);
    setConnectModalOpen(true);
  };

  const handleConnectSuccess = async () => {
    if (!connectModalProvider) return;
    try {
      const data = await fetchIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenSetupGuide = (provider: IntegrationProvider) => {
    setSetupGuideProvider(provider);
    setSetupGuideOpen(true);
  };

  const handleStartQuickConnect = () => {
    setSetupGuideOpen(false);
    if (setupGuideProvider) {
      handleOpenConnectModal(setupGuideProvider);
    }
  };

  const handleCreateDemoTicket = (provider: IntegrationProvider) => {
    router.push(`/integrations/${provider}`);
  };

  const handleRequestDisconnect = (provider: IntegrationProvider) => {
    setDisconnectProvider(provider);
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectProvider) return;
    await handleDisconnect(disconnectProvider);
    setDisconnectProvider(null);
  };

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties;

  const currentConnectProvider = integrations.find(
    (i) => i.meta.id === connectModalProvider
  );
  const currentSetupProvider = integrations.find(
    (i) => i.meta.id === setupGuideProvider
  );

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
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Connect Jira, ServiceNow, Okta, and Google Workspace Admin for
            end-to-end IT workflows.
          </p>

          {loading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Loading integrations...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {integrations.map((integration) => (
                <IntegrationCard
                  key={integration.meta.id}
                  integration={integration}
                  demoMode={demoMode}
                  isAdmin={isAdmin}
                  isBusy={busyProvider === integration.meta.id}
                  onConnect={handleConnect}
                  onDisconnect={handleRequestDisconnect}
                  onTest={handleTest}
                  onCreateDemoTicket={
                    demoMode ? handleCreateDemoTicket : undefined
                  }
                  onOpenSetupGuide={handleOpenSetupGuide}
                  onOpenConnectModal={handleOpenConnectModal}
                />
              ))}
            </div>
          )}
        </div>
      </SidebarInset>

      {connectModalProvider && currentConnectProvider && (
        <ConnectModal
          open={connectModalOpen}
          onOpenChange={setConnectModalOpen}
          provider={connectModalProvider}
          providerName={currentConnectProvider.meta.name}
          onSuccess={handleConnectSuccess}
        />
      )}

      {setupGuideProvider && currentSetupProvider && (
        <SetupGuidePanel
          open={setupGuideOpen}
          onOpenChange={setSetupGuideOpen}
          provider={setupGuideProvider}
          providerName={currentSetupProvider.meta.name}
          onStartQuickConnect={handleStartQuickConnect}
        />
      )}

      <AlertDialog
        open={!!disconnectProvider}
        onOpenChange={(open) => !open && setDisconnectProvider(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect this integration? This will
              stop all syncing and webhook processing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisconnect}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
