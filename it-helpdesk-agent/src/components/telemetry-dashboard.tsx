"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Activity, Bot, Server } from "lucide-react";
import { ServerStatusGrid } from "@/components/telemetry/server-status-grid";
import { MetricTimeSeries } from "@/components/telemetry/metric-time-series";
import { AIAgentLog } from "@/components/telemetry/ai-agent-log";
import { TelemetryAlertsTable } from "@/components/telemetry/telemetry-alerts-table";
import {
  generateMockServers,
  generateMockAlerts,
  generateAgentScript,
  type TelemetryServer,
  type TelemetryAlert,
  type AgentAction,
} from "@/lib/telemetry-data";

export function TelemetryDashboard() {
  const [servers, setServers] = React.useState<TelemetryServer[]>([]);
  const [alerts, setAlerts] = React.useState<TelemetryAlert[]>([]);
  const [agentActions, setAgentActions] = React.useState<AgentAction[]>([]);
  const [selectedServerId, setSelectedServerId] = React.useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [agentStep, setAgentStep] = React.useState(0);
  const agentScript = React.useRef<AgentAction[]>([]);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize data
  React.useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const mockServers = generateMockServers();
      const mockAlerts = generateMockAlerts();
      const script = generateAgentScript();

      setServers(mockServers);
      setAlerts(mockAlerts);
      agentScript.current = script;
      setSelectedServerId(mockServers[0].id);
      setIsLoading(false);
    };
    void init();
  }, []);

  // Simulate the AI agent progressing through its actions
  React.useEffect(() => {
    if (isLoading || agentScript.current.length === 0) return;

    // Show first few actions immediately
    const initialBatch = agentScript.current.slice(0, 3);
    setAgentActions(initialBatch);
    setAgentStep(3);

    intervalRef.current = setInterval(() => {
      setAgentStep((prev) => {
        const nextStep = prev + 1;
        if (nextStep > agentScript.current.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }

        const newAction = agentScript.current[prev];
        if (newAction) {
          setAgentActions((actions) => [...actions, newAction]);

          // Update alert statuses based on agent actions
          if (newAction.type === "analyze" && newAction.alertId) {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === newAction.alertId ? { ...a, status: "analyzing" as const } : a
              )
            );
          }
          if (newAction.type === "create_ticket" && newAction.alertId) {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === newAction.alertId
                  ? {
                      ...a,
                      status: "ticket_created" as const,
                      ticketId: newAction.ticketId,
                    }
                  : a
              )
            );
          }
        }

        return nextStep;
      });
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoading]);

  const selectedServer = servers.find((s) => s.id === selectedServerId);
  const isScanning = agentStep < agentScript.current.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Loading telemetry data...
          </p>
        </div>
      </div>
    );
  }

  const healthyCount = servers.filter((s) => s.status === "healthy").length;
  const warningCount = servers.filter((s) => s.status === "warning").length;
  const criticalCount = servers.filter((s) => s.status === "critical").length;

  return (
    <div className="flex flex-col gap-4 md:gap-6 py-4 md:py-6 px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Telemetry Monitoring
            </h1>
            <Badge variant="outline" className="gap-1 text-xs">
              <Bot className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time infrastructure monitoring with automated issue detection
            and ticket creation
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{servers.length} servers</span>
          </div>
          <Badge variant="outline" className="gap-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30">
            {healthyCount} healthy
          </Badge>
          {warningCount > 0 && (
            <Badge variant="outline" className="gap-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30">
              <Activity className="h-3 w-3" />
              {warningCount} warning
            </Badge>
          )}
          {criticalCount > 0 && (
            <Badge variant="outline" className="gap-1 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30">
              <Activity className="h-3 w-3" />
              {criticalCount} critical
            </Badge>
          )}
        </div>
      </div>

      {/* Server Status Grid */}
      <ServerStatusGrid
        servers={servers}
        selectedServerId={selectedServerId}
        onServerSelect={setSelectedServerId}
      />

      {/* Time Series Chart */}
      {selectedServer && <MetricTimeSeries server={selectedServer} />}

      {/* AI Agent Log + Alerts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AIAgentLog actions={agentActions} isScanning={isScanning} />
        <TelemetryAlertsTable alerts={alerts} />
      </div>
    </div>
  );
}
