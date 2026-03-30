// Telemetry mock data for AI-powered infrastructure monitoring

export interface TelemetryMetricPoint {
  time: string;
  value: number;
}

export interface TelemetryServer {
  id: string;
  name: string;
  type: "server" | "service" | "database";
  status: "healthy" | "warning" | "critical";
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  cpuHistory: TelemetryMetricPoint[];
  memoryHistory: TelemetryMetricPoint[];
  diskHistory: TelemetryMetricPoint[];
}

export interface TelemetryAlert {
  id: string;
  serverId: string;
  serverName: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: "warning" | "critical";
  detectedAt: string;
  status: "new" | "analyzing" | "ticket_created";
  ticketId?: string;
}

export interface AgentAction {
  id: string;
  timestamp: string;
  type: "scan" | "detect" | "analyze" | "create_ticket";
  serverId?: string;
  serverName?: string;
  alertId?: string;
  message: string;
  details?: string;
  ticketId?: string;
}

function generateTimeSeries(
  baseValue: number,
  variance: number,
  spikeAt?: number,
  spikeValue?: number
): TelemetryMetricPoint[] {
  const now = Date.now();
  return Array.from({ length: 60 }, (_, i) => {
    let value = baseValue + (Math.random() - 0.5) * variance;
    if (spikeAt !== undefined && spikeValue !== undefined && i >= spikeAt) {
      const spikeProgress = Math.min((i - spikeAt) / 8, 1);
      value = baseValue + (spikeValue - baseValue) * spikeProgress;
      value += (Math.random() - 0.5) * variance * 0.5;
    }
    return {
      time: new Date(now - (59 - i) * 60 * 1000).toISOString(),
      value: Math.max(0, Math.min(100, Math.round(value * 10) / 10)),
    };
  });
}

export function generateMockServers(): TelemetryServer[] {
  return [
    {
      id: "prod-web-01",
      name: "PROD-WEB-01",
      type: "server",
      status: "critical",
      cpu: 94,
      memory: 82,
      disk: 45,
      networkIn: 245,
      networkOut: 180,
      cpuHistory: generateTimeSeries(35, 10, 42, 94),
      memoryHistory: generateTimeSeries(60, 8, 45, 82),
      diskHistory: generateTimeSeries(44, 2),
    },
    {
      id: "prod-web-02",
      name: "PROD-WEB-02",
      type: "server",
      status: "healthy",
      cpu: 28,
      memory: 55,
      disk: 38,
      networkIn: 120,
      networkOut: 95,
      cpuHistory: generateTimeSeries(28, 8),
      memoryHistory: generateTimeSeries(55, 6),
      diskHistory: generateTimeSeries(38, 1),
    },
    {
      id: "prod-db-01",
      name: "PROD-DB-01",
      type: "database",
      status: "warning",
      cpu: 72,
      memory: 88,
      disk: 76,
      networkIn: 310,
      networkOut: 280,
      cpuHistory: generateTimeSeries(55, 12, 50, 72),
      memoryHistory: generateTimeSeries(85, 4),
      diskHistory: generateTimeSeries(75, 2),
    },
    {
      id: "prod-api-01",
      name: "PROD-API-01",
      type: "service",
      status: "healthy",
      cpu: 18,
      memory: 42,
      disk: 22,
      networkIn: 450,
      networkOut: 430,
      cpuHistory: generateTimeSeries(18, 6),
      memoryHistory: generateTimeSeries(42, 5),
      diskHistory: generateTimeSeries(22, 1),
    },
    {
      id: "prod-cache-01",
      name: "PROD-CACHE-01",
      type: "service",
      status: "healthy",
      cpu: 12,
      memory: 65,
      disk: 15,
      networkIn: 890,
      networkOut: 870,
      cpuHistory: generateTimeSeries(12, 4),
      memoryHistory: generateTimeSeries(65, 3),
      diskHistory: generateTimeSeries(15, 1),
    },
    {
      id: "prod-queue-01",
      name: "PROD-QUEUE-01",
      type: "service",
      status: "healthy",
      cpu: 22,
      memory: 48,
      disk: 30,
      networkIn: 200,
      networkOut: 190,
      cpuHistory: generateTimeSeries(22, 5),
      memoryHistory: generateTimeSeries(48, 4),
      diskHistory: generateTimeSeries(30, 2),
    },
  ];
}

export function generateMockAlerts(): TelemetryAlert[] {
  return [
    {
      id: "alert-1",
      serverId: "prod-web-01",
      serverName: "PROD-WEB-01",
      metric: "CPU",
      currentValue: 94,
      threshold: 85,
      severity: "critical",
      detectedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      status: "new",
    },
    {
      id: "alert-2",
      serverId: "prod-web-01",
      serverName: "PROD-WEB-01",
      metric: "Memory",
      currentValue: 82,
      threshold: 80,
      severity: "warning",
      detectedAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      status: "new",
    },
    {
      id: "alert-3",
      serverId: "prod-db-01",
      serverName: "PROD-DB-01",
      metric: "Memory",
      currentValue: 88,
      threshold: 85,
      severity: "warning",
      detectedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      status: "new",
    },
    {
      id: "alert-4",
      serverId: "prod-db-01",
      serverName: "PROD-DB-01",
      metric: "Disk",
      currentValue: 76,
      threshold: 75,
      severity: "warning",
      detectedAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      status: "new",
    },
  ];
}

export function generateAgentScript(): AgentAction[] {
  const now = Date.now();
  return [
    {
      id: "act-1",
      timestamp: new Date(now - 1000 * 60 * 10).toISOString(),
      type: "scan",
      message: "Starting scheduled infrastructure scan across 6 servers...",
    },
    {
      id: "act-2",
      timestamp: new Date(now - 1000 * 60 * 9).toISOString(),
      type: "scan",
      serverId: "prod-web-02",
      serverName: "PROD-WEB-02",
      message: "PROD-WEB-02 — All metrics within normal range",
    },
    {
      id: "act-3",
      timestamp: new Date(now - 1000 * 60 * 9).toISOString(),
      type: "scan",
      serverId: "prod-api-01",
      serverName: "PROD-API-01",
      message: "PROD-API-01 — All metrics within normal range",
    },
    {
      id: "act-4",
      timestamp: new Date(now - 1000 * 60 * 8).toISOString(),
      type: "detect",
      serverId: "prod-web-01",
      serverName: "PROD-WEB-01",
      alertId: "alert-1",
      message: "Anomaly detected: CPU at 94% on PROD-WEB-01 (threshold: 85%)",
    },
    {
      id: "act-5",
      timestamp: new Date(now - 1000 * 60 * 7).toISOString(),
      type: "analyze",
      serverId: "prod-web-01",
      serverName: "PROD-WEB-01",
      alertId: "alert-1",
      message: "Analyzing PROD-WEB-01: Cross-referencing CPU spike with memory usage, network I/O, and recent deployment logs...",
      details:
        "Memory also elevated at 82%. Network traffic normal. Last deployment: 45 minutes ago (v2.14.3). Pattern matches memory leak signature — process heap growing unbounded since deploy.",
    },
    {
      id: "act-6",
      timestamp: new Date(now - 1000 * 60 * 6).toISOString(),
      type: "create_ticket",
      serverId: "prod-web-01",
      serverName: "PROD-WEB-01",
      alertId: "alert-1",
      ticketId: "TKT-1030",
      message: "Ticket created: TKT-1030 — High CPU & memory on PROD-WEB-01 after v2.14.3 deploy",
      details:
        "Root cause: Suspected memory leak introduced in v2.14.3. Recommendation: Roll back deployment or restart web service and monitor. Assigned to DevOps team, Priority: High.",
    },
    {
      id: "act-7",
      timestamp: new Date(now - 1000 * 60 * 4).toISOString(),
      type: "detect",
      serverId: "prod-db-01",
      serverName: "PROD-DB-01",
      alertId: "alert-3",
      message: "Warning: Memory at 88% on PROD-DB-01 (threshold: 85%)",
    },
    {
      id: "act-8",
      timestamp: new Date(now - 1000 * 60 * 3).toISOString(),
      type: "analyze",
      serverId: "prod-db-01",
      serverName: "PROD-DB-01",
      alertId: "alert-3",
      message: "Analyzing PROD-DB-01: Checking query patterns, connection pool, and storage growth...",
      details:
        "Disk at 76% (near threshold). Active connections: 142 (normal: ~80). Slow query count increased 3x in the last hour. Likely caused by unoptimized queries from the new reporting feature.",
    },
    {
      id: "act-9",
      timestamp: new Date(now - 1000 * 60 * 2).toISOString(),
      type: "create_ticket",
      serverId: "prod-db-01",
      serverName: "PROD-DB-01",
      alertId: "alert-3",
      ticketId: "TKT-1031",
      message: "Ticket created: TKT-1031 — Database performance degradation on PROD-DB-01",
      details:
        "Root cause: Unoptimized queries from reporting feature causing high memory and connection pool exhaustion. Recommendation: Add missing indexes on reports table, review query execution plans. Assigned to DevOps team, Priority: Medium.",
    },
    {
      id: "act-10",
      timestamp: new Date(now - 1000 * 60 * 1).toISOString(),
      type: "scan",
      message: "Continuing monitoring... Next full scan in 5 minutes.",
    },
  ];
}

// Tickets generated by the telemetry agent — these should be added to the main dummy tickets
export const telemetryGeneratedTickets = [
  {
    id: "TKT-1030",
    lyzrUserId: "demo-user-001",
    ticket_type: "incident" as const,
    title: "High CPU & memory on PROD-WEB-01 after v2.14.3 deploy",
    description:
      "AI telemetry agent detected CPU at 94% and memory at 82% on PROD-WEB-01. Pattern matches memory leak signature — process heap growing unbounded since v2.14.3 deployment 45 minutes ago.",
    user_name: "Telemetry Agent",
    app_or_system: "PROD-WEB-01",
    priority: "high" as const,
    status: "open" as const,
    suggested_team: "DevOps" as const,
    collected_details: {
      cpu: "94%",
      memory: "82%",
      trigger: "Automated telemetry detection",
      probable_cause: "Memory leak in v2.14.3",
      recommendation: "Roll back deployment or restart web service",
    },
    source: "integration" as const,
    created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
  {
    id: "TKT-1031",
    lyzrUserId: "demo-user-001",
    ticket_type: "incident" as const,
    title: "Database performance degradation on PROD-DB-01",
    description:
      "AI telemetry agent detected memory at 88% and disk at 76% on PROD-DB-01. Active connections at 142 (normal: ~80). Slow query count increased 3x in the last hour due to unoptimized queries from the new reporting feature.",
    user_name: "Telemetry Agent",
    app_or_system: "PROD-DB-01",
    priority: "medium" as const,
    status: "open" as const,
    suggested_team: "DevOps" as const,
    collected_details: {
      memory: "88%",
      disk: "76%",
      active_connections: 142,
      trigger: "Automated telemetry detection",
      probable_cause: "Unoptimized queries from reporting feature",
      recommendation: "Add missing indexes on reports table",
    },
    source: "integration" as const,
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];
