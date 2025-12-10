// Analytics data store for enterprise admin console
// Provides aggregated metrics and analytics data

import { Ticket } from "./ticket-types";
import {
  calculateMTTR,
  calculateFirstResponseTime,
  calculateSLACompliance,
  checkSLABreach,
  getLifecycleStage,
} from "./ticket-types";
import {
  subDays,
  format,
  differenceInHours,
  differenceInMinutes,
  addHours,
  isAfter,
  isBefore,
} from "date-fns";

// KPI Metrics
export interface KPIMetrics {
  totalTickets: number;
  open: number;
  inProgress: number;
  resolved: number;
  mttr: number; // Mean Time To Resolution in hours
  firstResponseTime: number; // First Response Time in hours
  slaCompliance: number | null; // Percentage, or null if no resolved tickets
  csat: number | null; // Customer Satisfaction percentage, or null if no ratings
  // Deltas vs previous period
  totalTicketsDelta: number;
  openDelta: number;
  inProgressDelta: number;
  resolvedDelta: number;
  mttrDelta: number;
  firstResponseTimeDelta: number;
  slaComplianceDelta: number | null;
  csatDelta: number | null;
  // Trend data for sparklines (last 7 days)
  totalTicketsTrend: number[];
  openTrend: number[];
  inProgressTrend: number[];
  resolvedTrend: number[];
  mttrTrend: number[];
  firstResponseTimeTrend: number[];
  slaComplianceTrend: (number | null)[];
  csatTrend: (number | null)[];
}

// SLA Funnel Data
export interface SLAFunnelData {
  priority: string;
  total: number;
  meetingSLA: number;
  breached: number;
  slaPercentage: number | null; // null when no resolved tickets
  breachedTickets: Ticket[];
}

// Top Issue
export interface TopIssue {
  issue: string;
  count: number;
  trend: number; // Percentage change
  sampleTicketIds: string[];
  suggestedKBArticle?: string;
  category: string;
}

// Team Performance
export interface TeamPerformance {
  team: string;
  queueSize: number;
  avgFirstResponse: number; // hours
  avgResolution: number; // hours
  backlog: number;
  loadScore: "low" | "medium" | "high";
  agents: AgentPerformance[];
}

export interface AgentPerformance {
  name: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  avgHandleTime: number; // hours
  reopenRate: number; // percentage
  currentWorkload: "low" | "medium" | "high";
}

// Lifecycle Funnel
export interface LifecycleStageData {
  stage: string;
  count: number;
  conversionRate: number; // Percentage from previous stage
  medianTime: number; // hours
  tickets: Ticket[];
}

// Forecast Data
export interface ForecastData {
  date: string;
  predictedCount: number;
  confidenceLower: number;
  confidenceUpper: number;
  anomalyFlag: boolean;
  anomalyReason?: string;
  // Enhanced anomaly details
  anomalyType?: "forecasted" | "detected"; // forecasted = future risk, detected = historical/real-time
  anomalyHeadline?: string; // Short headline (1 line)
  anomalyReasons?: string[]; // 1-3 short reason bullets
  anomalyConfidence?: "low" | "medium" | "high"; // Model confidence
  anomalyImpact?: "low" | "medium" | "high"; // Impact level
  anomalyActions?: Array<{ label: string; primary?: boolean }>; // Suggested actions
  anomalyProvenance?: string; // Data sources used
}

// Live Event
export interface LiveEvent {
  id: string;
  type:
    | "ticket_created"
    | "ticket_updated"
    | "ticket_assigned"
    | "ticket_resolved"
    | "sla_breached"
    | "sla_warning"
    | "external_id_created"
    | "approval_pending"
    | "access_request_submitted"
    | "access_request_approved"
    | "access_request_reminder"
    | "automation_fired"
    | "integration_event"
    | "ai_insight"
    | "ai_anomaly";
  timestamp: string;
  ticketId?: string;
  requestId?: string; // For access requests
  actor?: string;
  description: string;
  headline?: string; // Short bold headline
  details?: string; // Secondary details (2 lines max)
  externalId?: string;
  severity?: "low" | "medium" | "high" | "critical";
  category?:
    | "tickets"
    | "access"
    | "sla"
    | "automations"
    | "integrations"
    | "ai_insights";
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

// In-memory stores
let auditLogs: AuditLogEntry[] = [];
let liveEvents: LiveEvent[] = [];

// Get KPI Metrics
export function getKPIMetrics(
  tickets: Ticket[],
  startDate?: Date,
  endDate?: Date
): KPIMetrics {
  const now = endDate || new Date();
  const start = startDate || subDays(now, 7);
  const previousStart = subDays(start, 7);
  const previousEnd = start;

  // Filter tickets by date range for metrics/trends
  const filteredTickets = tickets.filter((t) => {
    const created = new Date(t.created_at);
    return created >= start && created <= now;
  });

  const previousTickets = tickets.filter((t) => {
    const created = new Date(t.created_at);
    return created >= previousStart && created < previousEnd;
  });

  // Calculate summary counts using ALL tickets (not filtered by date)
  // This ensures the dashboard shows current state of all tickets
  const totalTickets = tickets.length;
  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const resolved = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  ).length;

  // Calculate metrics using filtered tickets (for period-specific analysis)
  const mttr = calculateMTTR(filteredTickets);
  const firstResponseTime = calculateFirstResponseTime(filteredTickets);
  const slaCompliance = calculateSLACompliance(filteredTickets);

  // Calculate CSAT from actual ratings (thumbs up = 1, thumbs down = 0)
  const ratedTickets = filteredTickets.filter(
    (t) => t.csat_score !== undefined && t.csat_score !== null
  );
  const csat =
    ratedTickets.length > 0
      ? (ratedTickets.filter((t) => t.csat_score === 1).length /
          ratedTickets.length) *
        100
      : null;

  // Calculate previous period metrics for deltas
  const prevTotal = previousTickets.length;
  const prevOpen = previousTickets.filter((t) => t.status === "open").length;
  const prevInProgress = previousTickets.filter(
    (t) => t.status === "in_progress"
  ).length;
  const prevResolved = previousTickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  ).length;
  const prevMTTR = calculateMTTR(previousTickets);
  const prevFRT = calculateFirstResponseTime(previousTickets);
  const prevSLA = calculateSLACompliance(previousTickets);

  // Calculate previous period CSAT
  const prevRatedTickets = previousTickets.filter(
    (t) => t.csat_score !== undefined && t.csat_score !== null
  );
  const prevCSAT =
    prevRatedTickets.length > 0
      ? (prevRatedTickets.filter((t) => t.csat_score === 1).length /
          prevRatedTickets.length) *
        100
      : null;

  // Calculate deltas
  const calculateDelta = (
    current: number | null,
    previous: number | null
  ): number | null => {
    if (current === null && previous === null) return null;
    if (current === null) return null;
    if (previous === null) return current > 0 ? 100 : null;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate summary counts for filtered period (for delta comparison)
  const filteredTotal = filteredTickets.length;
  const filteredOpen = filteredTickets.filter(
    (t) => t.status === "open"
  ).length;
  const filteredInProgress = filteredTickets.filter(
    (t) => t.status === "in_progress"
  ).length;
  const filteredResolved = filteredTickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  ).length;

  // Generate trend data (last 7 days)
  const trendDays = 7;
  const totalTicketsTrend: number[] = [];
  const openTrend: number[] = [];
  const inProgressTrend: number[] = [];
  const resolvedTrend: number[] = [];
  const mttrTrend: number[] = [];
  const firstResponseTimeTrend: number[] = [];
  const slaComplianceTrend: (number | null)[] = [];
  const csatTrend: (number | null)[] = [];

  for (let i = trendDays - 1; i >= 0; i--) {
    const dayStart = subDays(now, i + 1);
    const dayEnd = subDays(now, i);
    const dayTickets = tickets.filter((t) => {
      const created = new Date(t.created_at);
      return created >= dayStart && created < dayEnd;
    });

    totalTicketsTrend.push(dayTickets.length);
    openTrend.push(dayTickets.filter((t) => t.status === "open").length);
    inProgressTrend.push(
      dayTickets.filter((t) => t.status === "in_progress").length
    );
    resolvedTrend.push(
      dayTickets.filter((t) => t.status === "resolved" || t.status === "closed")
        .length
    );
    mttrTrend.push(calculateMTTR(dayTickets));
    firstResponseTimeTrend.push(calculateFirstResponseTime(dayTickets));
    const daySLA = calculateSLACompliance(dayTickets);
    slaComplianceTrend.push(daySLA ?? null);

    // Calculate CSAT for this day
    const dayRatedTickets = dayTickets.filter(
      (t) => t.csat_score !== undefined && t.csat_score !== null
    );
    const dayCSAT =
      dayRatedTickets.length > 0
        ? (dayRatedTickets.filter((t) => t.csat_score === 1).length /
            dayRatedTickets.length) *
          100
        : null;
    csatTrend.push(dayCSAT);
  }

  // Calculate deltas (ensure numbers for non-nullable fields)
  const totalTicketsDelta = calculateDelta(filteredTotal, prevTotal) ?? 0;
  const openDelta = calculateDelta(filteredOpen, prevOpen) ?? 0;
  const inProgressDelta =
    calculateDelta(filteredInProgress, prevInProgress) ?? 0;
  const resolvedDelta = calculateDelta(filteredResolved, prevResolved) ?? 0;
  const mttrDelta = calculateDelta(mttr, prevMTTR) ?? 0;
  const firstResponseTimeDelta =
    calculateDelta(firstResponseTime, prevFRT) ?? 0;
  const slaComplianceDelta = calculateDelta(
    slaCompliance ?? null,
    prevSLA ?? null
  );
  const csatDelta = calculateDelta(csat ?? null, prevCSAT ?? null);

  return {
    totalTickets,
    open,
    inProgress,
    resolved,
    mttr,
    firstResponseTime,
    slaCompliance,
    csat,
    totalTicketsDelta,
    openDelta,
    inProgressDelta,
    resolvedDelta,
    mttrDelta,
    firstResponseTimeDelta,
    slaComplianceDelta,
    csatDelta,
    totalTicketsTrend,
    openTrend,
    inProgressTrend,
    resolvedTrend,
    mttrTrend,
    firstResponseTimeTrend,
    slaComplianceTrend,
    csatTrend,
  };
}

// Get SLA Funnel Data
// SLA percentage only considers closed tickets for compliance calculation
export function getSLAFunnel(tickets: Ticket[]): SLAFunnelData[] {
  const priorities = ["high", "medium", "low"] as const;
  const result: SLAFunnelData[] = [];

  for (const priority of priorities) {
    const priorityTickets = tickets.filter((t) => t.priority === priority);
    const total = priorityTickets.length;
    const breached = priorityTickets.filter(checkSLABreach).length;

    // For SLA compliance percentage, only consider resolved/closed tickets
    const resolvedTicketsWithSLA = priorityTickets.filter(
      (t) => (t.status === "resolved" || t.status === "closed") && t.sla_due_at
    );

    let meetingSLA = 0;
    let slaPercentage: number | null = null;

    if (resolvedTicketsWithSLA.length > 0) {
      // Count resolved tickets that were resolved before or on SLA due date
      meetingSLA = resolvedTicketsWithSLA.filter((t) => {
        if (!t.resolved_at) {
          const resolvedAt = new Date(t.updated_at).getTime();
          const slaDue = new Date(t.sla_due_at!).getTime();
          return resolvedAt <= slaDue;
        }
        const resolved = new Date(t.resolved_at).getTime();
        const slaDue = new Date(t.sla_due_at!).getTime();
        return resolved <= slaDue;
      }).length;

      slaPercentage = (meetingSLA / resolvedTicketsWithSLA.length) * 100;
    }

    result.push({
      priority: priority.toUpperCase(),
      total,
      meetingSLA,
      breached,
      slaPercentage,
      breachedTickets: priorityTickets.filter(checkSLABreach),
    });
  }

  return result;
}

// Get Top Issues (auto-grouped by title similarity)
export function getTopIssues(
  tickets: Ticket[],
  limit: number = 10
): TopIssue[] {
  // Simple grouping by title keywords
  const issueMap = new Map<string, Ticket[]>();

  for (const ticket of tickets) {
    // Extract key words from title (simple approach)
    const words = ticket.title.toLowerCase().split(/\s+/);
    const keyWords = words.filter((w) => w.length > 4); // Filter short words
    const key = keyWords.slice(0, 3).join(" ") || ticket.title.toLowerCase();

    if (!issueMap.has(key)) {
      issueMap.set(key, []);
    }
    issueMap.get(key)!.push(ticket);
  }

  const issues: TopIssue[] = [];

  for (const [key, issueTickets] of issueMap.entries()) {
    if (issueTickets.length < 2) continue; // Only show issues with 2+ tickets

    const sorted = issueTickets.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const recent = sorted.slice(0, 7); // Last 7 days
    const older = sorted.slice(7); // Before that

    const recentCount = recent.length;
    const olderCount = older.length;
    const trend =
      olderCount > 0 ? ((recentCount - olderCount) / olderCount) * 100 : 0;

    issues.push({
      issue:
        issueTickets[0].title.substring(0, 60) +
        (issueTickets[0].title.length > 60 ? "..." : ""),
      count: issueTickets.length,
      trend,
      sampleTicketIds: issueTickets.slice(0, 3).map((t) => t.id),
      suggestedKBArticle: `KB-${issueTickets[0].ticket_type.toUpperCase()}-${Math.floor(
        Math.random() * 1000
      )}`,
      category: issueTickets[0].ticket_type,
    });
  }

  return issues.sort((a, b) => b.count - a.count).slice(0, limit);
}

// Get Team Performance
export function getTeamPerformance(tickets: Ticket[]): TeamPerformance[] {
  const teams = [
    "Network",
    "Endpoint Support",
    "Application Support",
    "IAM",
    "Security",
    "DevOps",
  ] as const;
  const agents = [
    "John Doe",
    "Jane Smith",
    "Bob Johnson",
    "Alice Williams",
    "Charlie Brown",
  ];

  const result: TeamPerformance[] = [];

  for (const team of teams) {
    const teamTickets = tickets.filter((t) => t.suggested_team === team);
    const openTickets = teamTickets.filter(
      (t) => t.status !== "resolved" && t.status !== "closed"
    );
    const resolvedTickets = teamTickets.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    );

    const avgFirstResponse = calculateFirstResponseTime(teamTickets);
    const avgResolution = calculateMTTR(teamTickets);
    const backlog = openTickets.length;

    // Calculate load score
    let loadScore: "low" | "medium" | "high" = "low";
    if (backlog > 20) loadScore = "high";
    else if (backlog > 10) loadScore = "medium";

    // Mock agent performance
    const agentCount = Math.floor(Math.random() * 3) + 2; // 2-4 agents per team
    const teamAgents: AgentPerformance[] = [];

    for (let i = 0; i < agentCount; i++) {
      const agentTickets = teamTickets.filter(
        (t) => t.assignee === agents[i] || !t.assignee
      );
      const assigned = agentTickets.length;
      const resolved = agentTickets.filter(
        (t) => t.status === "resolved" || t.status === "closed"
      ).length;
      const handleTime = calculateMTTR(agentTickets);
      const reopened = agentTickets.filter(
        (t) => (t.reopened_count || 0) > 0
      ).length;
      const reopenRate = assigned > 0 ? (reopened / assigned) * 100 : 0;

      let workload: "low" | "medium" | "high" = "low";
      if (assigned > 15) workload = "high";
      else if (assigned > 8) workload = "medium";

      teamAgents.push({
        name: agents[i] || `Agent ${i + 1}`,
        ticketsAssigned: assigned,
        ticketsResolved: resolved,
        avgHandleTime: handleTime,
        reopenRate,
        currentWorkload: workload,
      });
    }

    result.push({
      team,
      queueSize: openTickets.length,
      avgFirstResponse,
      avgResolution,
      backlog,
      loadScore,
      agents: teamAgents,
    });
  }

  return result;
}

// Get Lifecycle Funnel
export function getLifecycleFunnel(tickets: Ticket[]): LifecycleStageData[] {
  const stages: LifecycleStageData[] = [];
  const stageOrder: Array<
    "new" | "triage" | "in_progress" | "resolved" | "closed"
  > = ["new", "triage", "in_progress", "resolved", "closed"];

  let previousCount = tickets.length;

  for (const stage of stageOrder) {
    const stageTickets = tickets.filter((t) => getLifecycleStage(t) === stage);
    const count = stageTickets.length;
    const conversionRate =
      previousCount > 0 ? (count / previousCount) * 100 : 0;

    // Calculate median time in stage (mock for now)
    const medianTime = stageTickets.length > 0 ? Math.random() * 24 : 0; // Mock hours

    stages.push({
      stage,
      count,
      conversionRate,
      medianTime,
      tickets: stageTickets,
    });

    previousCount = count;
  }

  return stages;
}

// Get Forecast Data (mocked)
export function getForecast(days: number = 7): ForecastData[] {
  const forecast: ForecastData[] = [];
  const baseCount = 10;
  const now = new Date();

  // Seed example anomalies for demo
  // VPN anomaly: forecasted (future) - appears 3 days from now
  const vpnAnomalyDate = format(subDays(now, -3), "yyyy-MM-dd");
  // Access anomaly: detected (recently discovered, still relevant) - appears on day 1
  const accessAnomalyDate = format(subDays(now, -1), "yyyy-MM-dd"); // Tomorrow (detected today, relevant for forecast)

  for (let i = 0; i < days; i++) {
    const date = format(subDays(now, -i - 1), "yyyy-MM-dd");
    let predicted = baseCount + Math.random() * 5;
    const confidence = 2;

    // Check if this date matches our seeded anomalies
    const isVpnAnomaly = date === vpnAnomalyDate;
    const isAccessAnomaly = date === accessAnomalyDate;

    if (isVpnAnomaly) {
      // VPN surge forecasted anomaly
      predicted = baseCount * 3; // 200% increase
      forecast.push({
        date,
        predictedCount: Math.round(predicted),
        confidenceLower: Math.round(predicted - confidence * 2),
        confidenceUpper: Math.round(predicted + confidence * 2),
        anomalyFlag: true,
        anomalyType: "forecasted",
        anomalyReason: "VPN surge +200% vs baseline",
        anomalyHeadline: "VPN surge expected (+200% vs baseline)",
        anomalyReasons: [
          "Historical pattern: VPN spikes on Fridays during WFH (last 12 weeks).",
          "Planned VPN gateway update scheduled on Dec 11.",
        ],
        anomalyConfidence: "high",
        anomalyImpact: "high",
        anomalyActions: [
          { label: "Create Incident", primary: true },
          { label: "Notify Network Team" },
        ],
        anomalyProvenance:
          "Based on 90 days of ticket history + scheduled change calendar + integration events",
      });
    } else if (isAccessAnomaly) {
      // Access request detected anomaly
      predicted = baseCount * 1.8; // 80% increase
      forecast.push({
        date,
        predictedCount: Math.round(predicted),
        confidenceLower: Math.round(predicted - confidence * 1.5),
        confidenceUpper: Math.round(predicted + confidence * 1.5),
        anomalyFlag: true,
        anomalyType: "detected",
        anomalyReason: "Access request surge detected (+80%)",
        anomalyHeadline: "Access request surge detected (+80%)",
        anomalyReasons: [
          "New joiner batch processed by HR yesterday.",
          "Approver delays observed in last 48h.",
        ],
        anomalyConfidence: "medium",
        anomalyImpact: "medium",
        anomalyActions: [
          { label: "Send Reminder to Approvers", primary: true },
          { label: "Create Incident" },
        ],
        anomalyProvenance:
          "Based on 90 days of ticket history + scheduled change calendar + integration events",
      });
    } else {
      // Normal forecast
      forecast.push({
        date,
        predictedCount: Math.round(predicted),
        confidenceLower: Math.round(predicted - confidence),
        confidenceUpper: Math.round(predicted + confidence),
        anomalyFlag: false,
      });
    }
  }

  return forecast;
}

// Get Asset Data (will be enhanced with mock-assets)
export function getAssetData(assetId: string, tickets: Ticket[]) {
  const assetTickets = tickets.filter((t) => t.asset_id === assetId);
  return {
    ticketCount: assetTickets.length,
    tickets: assetTickets,
  };
}

// Access Request Analytics Data Structures
export interface AccessRequestKPI {
  pending: number;
  avgApprovalTime: number | null; // null when no resolved tickets
  slaCompliance: number | null; // null when no resolved tickets
  overdue: number;
  // Deltas vs previous period
  pendingDelta: number;
  avgApprovalTimeDelta: number | null;
  slaComplianceDelta: number | null;
  overdueDelta: number;
  // Trend data for sparklines (last 7 days)
  pendingTrend: number[];
  avgApprovalTimeTrend: (number | null)[];
  slaComplianceTrend: (number | null)[];
  overdueTrend: number[];
}

export interface AccessRequestTrendData {
  date: string;
  volume: number;
  movingAverage: number;
  isAnomaly: boolean;
}

export interface TopApplication {
  name: string;
  requests: number;
  avgApprovalTime: number;
  slaCompliance: number;
}

export interface ManagerPerformance {
  manager: string;
  avgApprovalTime: number;
  requestCount: number;
  overdueCount: number;
  overduePercentage: number;
  lastReminderSent?: string;
}

export interface PendingApproval {
  requestId: string;
  ticketId: string;
  requester: string;
  department?: string;
  application: string;
  requestedAt: string;
  approver: string;
  slaDueAt: string;
  status: "pending" | "overdue" | "breached";
  timeRemaining?: number; // hours
  timeOverdue?: number; // hours
  lastReminderSent?: string;
}

export interface AccessRequestInsight {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  actions: Array<{ label: string; primary?: boolean }>;
}

export interface AutomationRecommendation {
  id: string;
  name: string;
  description: string;
  recommended: boolean;
  reason?: string;
  potentialImpact?: string;
  riskLevel: "low" | "medium" | "high";
}

export interface AccessRequestAnalytics {
  kpis: AccessRequestKPI;
  trendData: AccessRequestTrendData[];
  topApplications: TopApplication[];
  slowestApprovers: ManagerPerformance[];
  fastestApprovers: ManagerPerformance[];
  pendingApprovals: PendingApproval[];
  insights: AccessRequestInsight[];
  automationRecommendations: AutomationRecommendation[];
}

// Seeded demo data for access requests
const seededManagers: ManagerPerformance[] = [
  {
    manager: "John Manager",
    avgApprovalTime: 72,
    requestCount: 11,
    overdueCount: 6,
    overduePercentage: 54.5,
  },
  {
    manager: "Jane Director",
    avgApprovalTime: 6,
    requestCount: 8,
    overdueCount: 0,
    overduePercentage: 0,
  },
  {
    manager: "Bob VP",
    avgApprovalTime: 48,
    requestCount: 15,
    overdueCount: 3,
    overduePercentage: 20,
  },
  {
    manager: "Alice Smith",
    avgApprovalTime: 36,
    requestCount: 12,
    overdueCount: 2,
    overduePercentage: 16.7,
  },
  {
    manager: "Charlie Brown",
    avgApprovalTime: 24,
    requestCount: 9,
    overdueCount: 1,
    overduePercentage: 11.1,
  },
  {
    manager: "Diana Prince",
    avgApprovalTime: 12,
    requestCount: 7,
    overdueCount: 0,
    overduePercentage: 0,
  },
  {
    manager: "Edward Norton",
    avgApprovalTime: 60,
    requestCount: 10,
    overdueCount: 4,
    overduePercentage: 40,
  },
  {
    manager: "Fiona Apple",
    avgApprovalTime: 18,
    requestCount: 6,
    overdueCount: 0,
    overduePercentage: 0,
  },
  {
    manager: "George Lucas",
    avgApprovalTime: 42,
    requestCount: 13,
    overdueCount: 2,
    overduePercentage: 15.4,
  },
  {
    manager: "Helen Mirren",
    avgApprovalTime: 30,
    requestCount: 8,
    overdueCount: 1,
    overduePercentage: 12.5,
  },
];

const seededApplications = [
  "Jira",
  "Salesforce",
  "GitHub",
  "Google Workspace",
  "Slack",
  "Okta",
];
const seededDepartments = [
  "Engineering",
  "Sales",
  "Marketing",
  "Operations",
  "HR",
  "Finance",
];

// Generate seeded pending approvals
function generateSeededPendingApprovals(tickets: Ticket[]): PendingApproval[] {
  const accessRequests = tickets.filter(
    (t) =>
      t.ticket_type === "access_request" &&
      t.status !== "resolved" &&
      t.status !== "closed"
  );
  const now = new Date();
  const pending: PendingApproval[] = [];

  accessRequests.forEach((ticket, idx) => {
    const requestedAt = new Date(ticket.created_at);
    const slaHours = 24; // Default SLA: 24 hours
    const slaDueAt = addHours(requestedAt, slaHours);
    const isOverdue = isAfter(now, slaDueAt);
    const timeOverdue = isOverdue ? differenceInHours(now, slaDueAt) : 0;
    const timeRemaining = !isOverdue
      ? differenceInHours(slaDueAt, now)
      : undefined;

    // Assign approver based on ticket data or seeded managers
    const approver = seededManagers[idx % seededManagers.length].manager;
    const application =
      ticket.app_or_system ||
      seededApplications[idx % seededApplications.length];

    pending.push({
      requestId: `AR-${ticket.id.slice(-6)}`,
      ticketId: ticket.id,
      requester: ticket.user_name || `User ${idx + 1}`,
      department: seededDepartments[idx % seededDepartments.length],
      application,
      requestedAt: ticket.created_at,
      approver,
      slaDueAt: slaDueAt.toISOString(),
      status: timeOverdue > 48 ? "breached" : isOverdue ? "overdue" : "pending",
      timeRemaining,
      timeOverdue: isOverdue ? timeOverdue : undefined,
    });
  });

  // Add some additional seeded pending approvals if we don't have enough
  if (pending.length < 20) {
    for (let i = pending.length; i < 20; i++) {
      const requestedAt = subDays(now, Math.floor(Math.random() * 7));
      const slaHours = 24;
      const slaDueAt = addHours(requestedAt, slaHours);
      const isOverdue = isAfter(now, slaDueAt);
      const timeOverdue = isOverdue ? differenceInHours(now, slaDueAt) : 0;
      const approver = seededManagers[i % seededManagers.length].manager;
      const application = seededApplications[i % seededApplications.length];

      pending.push({
        requestId: `AR-SEED-${String(i + 1).padStart(4, "0")}`,
        ticketId: `TKT-SEED-${String(i + 1).padStart(4, "0")}`,
        requester: `User ${i + 1}`,
        department: seededDepartments[i % seededDepartments.length],
        application,
        requestedAt: requestedAt.toISOString(),
        approver,
        slaDueAt: slaDueAt.toISOString(),
        status:
          timeOverdue > 48 ? "breached" : isOverdue ? "overdue" : "pending",
        timeRemaining: !isOverdue
          ? differenceInHours(slaDueAt, now)
          : undefined,
        timeOverdue: isOverdue ? timeOverdue : undefined,
      });
    }
  }

  return pending.sort((a, b) => {
    // Sort by status (breached first, then overdue, then pending)
    const statusOrder = { breached: 3, overdue: 2, pending: 1 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[b.status] - statusOrder[a.status];
    }
    return (
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  });
}

// Get Access Request Analytics (Enterprise-ready)
export function getAccessRequestAnalytics(
  tickets: Ticket[],
  periodDays: number = 30
): AccessRequestAnalytics {
  const accessRequests = tickets.filter(
    (t) => t.ticket_type === "access_request"
  );
  const now = new Date();
  const periodStart = subDays(now, periodDays);
  const previousPeriodStart = subDays(periodStart, periodDays);

  // Helper function to parse dates (handles MongoDB format and regular dates)
  const parseDate = (dateValue: unknown): Date | null => {
    if (!dateValue) return null;
    try {
      // Handle MongoDB date format { $date: "..." }
      if (
        typeof dateValue === "object" &&
        dateValue !== null &&
        "$date" in dateValue
      ) {
        return new Date((dateValue as { $date: string }).$date);
      }
      return new Date(dateValue as string | number | Date);
    } catch {
      return null;
    }
  };

  // Filter requests by period
  const periodRequests = accessRequests.filter((t) => {
    const createdDate = parseDate(t.created_at);
    return createdDate && createdDate >= periodStart;
  });
  const previousPeriodRequests = accessRequests.filter((t) => {
    const createdDate = parseDate(t.created_at);
    return (
      createdDate &&
      createdDate >= previousPeriodStart &&
      createdDate < periodStart
    );
  });

  // Calculate KPIs
  const pending = accessRequests.filter(
    (t) => t.status !== "resolved" && t.status !== "closed"
  ).length;
  const previousPending = previousPeriodRequests.filter(
    (t) => t.status !== "resolved" && t.status !== "closed"
  ).length;

  // Calculate average approval time (for resolved requests in the period)
  const resolvedRequests = periodRequests.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  );
  let totalApprovalTime = 0;
  let approvedCount = 0;
  resolvedRequests.forEach((t) => {
    // Check if ticket has resolved_at, if not, skip it
    if (!t.resolved_at || !t.created_at) {
      return;
    }

    // Use the parseDate helper function
    const resolvedDate = parseDate(t.resolved_at);
    const createdDate = parseDate(t.created_at);

    if (!resolvedDate || !createdDate) {
      return;
    }

    // Validate dates are valid
    if (isNaN(resolvedDate.getTime()) || isNaN(createdDate.getTime())) {
      return;
    }

    const minutes = differenceInMinutes(resolvedDate, createdDate);
    // Only count if minutes is a valid positive number
    if (minutes >= 0 && isFinite(minutes)) {
      // Convert minutes to hours for storage (to maintain consistency with display format)
      totalApprovalTime += minutes / 60;
      approvedCount++;
    }
  });
  const avgApprovalTime =
    approvedCount > 0 ? totalApprovalTime / approvedCount : null;

  // Previous period avg approval time
  const prevResolved = previousPeriodRequests.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  );
  let prevTotalTime = 0;
  let prevApprovedCount = 0;
  prevResolved.forEach((t) => {
    const resolvedDate = parseDate(t.resolved_at);
    const createdDate = parseDate(t.created_at);

    if (!resolvedDate || !createdDate) {
      return;
    }

    const minutes = differenceInMinutes(resolvedDate, createdDate);
    if (minutes >= 0 && isFinite(minutes)) {
      // Convert minutes to hours for storage
      prevTotalTime += minutes / 60;
      prevApprovedCount++;
    }
  });
  const prevAvgApprovalTime =
    prevApprovedCount > 0 ? prevTotalTime / prevApprovedCount : null;

  // SLA Compliance (24 hour target)
  const slaTargetHours = 24;
  const slaCompliant = resolvedRequests.filter((t) => {
    if (!t.resolved_at || !t.created_at) return false;
    return (
      differenceInHours(new Date(t.resolved_at), new Date(t.created_at)) <=
      slaTargetHours
    );
  }).length;
  const slaCompliance =
    resolvedRequests.length > 0
      ? (slaCompliant / resolvedRequests.length) * 100
      : null;

  const prevSlaCompliant = prevResolved.filter((t) => {
    if (!t.resolved_at || !t.created_at) return false;
    return (
      differenceInHours(new Date(t.resolved_at), new Date(t.created_at)) <=
      slaTargetHours
    );
  }).length;
  const prevSlaCompliance =
    prevResolved.length > 0
      ? (prevSlaCompliant / prevResolved.length) * 100
      : null;

  // Overdue approvals - calculate from real pending access requests
  const pendingAccessRequests = accessRequests.filter(
    (t) => t.status !== "resolved" && t.status !== "closed"
  );
  const overdue = pendingAccessRequests.filter((t) => {
    if (!t.sla_due_at) return false;
    return isAfter(now, new Date(t.sla_due_at));
  }).length;

  // Previous period overdue
  const prevPending = previousPeriodRequests.filter(
    (t) => t.status !== "resolved" && t.status !== "closed"
  );
  const prevPeriodEnd = periodStart;
  const prevOverdue = prevPending.filter((t) => {
    if (!t.sla_due_at) return false;
    return isAfter(prevPeriodEnd, new Date(t.sla_due_at));
  }).length;

  // Generate real pending approvals from tickets (no seeded data)
  const pendingApprovals: PendingApproval[] = pendingAccessRequests
    .map((t) => {
      const requestedAt = new Date(t.created_at);
      const slaDueAt = t.sla_due_at
        ? new Date(t.sla_due_at)
        : addHours(requestedAt, 24);
      const isOverdue = isAfter(now, slaDueAt);
      const timeOverdue = isOverdue ? differenceInHours(now, slaDueAt) : 0;
      const timeRemaining = !isOverdue
        ? differenceInHours(slaDueAt, now)
        : undefined;

      const status: "pending" | "overdue" | "breached" =
        timeOverdue > 48 ? "breached" : isOverdue ? "overdue" : "pending";

      return {
        requestId: `AR-${t.id.slice(-6)}`,
        ticketId: t.id,
        requester: t.user_name || "Unknown",
        department: undefined, // Not stored in ticket
        application: t.app_or_system || "Unknown",
        requestedAt: t.created_at,
        approver: t.assignee || "Unassigned",
        slaDueAt: slaDueAt.toISOString(),
        status,
        timeRemaining,
        timeOverdue: isOverdue ? timeOverdue : undefined,
      };
    })
    .sort((a, b) => {
      // Sort by status (breached first, then overdue, then pending)
      const statusOrder = { breached: 3, overdue: 2, pending: 1 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[b.status] - statusOrder[a.status];
      }
      return (
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
    });

  // Generate trend data (last 30 days)
  const trendData: AccessRequestTrendData[] = [];
  const dailyVolumes: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    const dayRequests = accessRequests.filter((t) => {
      const reqDate = new Date(t.created_at);
      return format(reqDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    });
    const volume = dayRequests.length;
    dailyVolumes.push(volume);

    // Calculate 7-day moving average
    const startIdx = Math.max(0, dailyVolumes.length - 7);
    const window = dailyVolumes.slice(startIdx);
    const movingAvg = window.reduce((a, b) => a + b, 0) / window.length;

    // Mark anomalies (spikes > 2x average)
    const isAnomaly = volume > movingAvg * 2 && volume > 5;

    trendData.push({
      date: format(date, "MMM d"),
      volume,
      movingAverage: Math.round(movingAvg * 10) / 10,
      isAnomaly,
    });
  }

  // Top Applications
  const appStats = new Map<
    string,
    { count: number; totalTime: number; compliant: number; total: number }
  >();
  periodRequests.forEach((t) => {
    const app = t.app_or_system || "Other";
    const stats = appStats.get(app) || {
      count: 0,
      totalTime: 0,
      compliant: 0,
      total: 0,
    };
    stats.count++;
    stats.total++;
    if (t.resolved_at && t.created_at) {
      const hours = differenceInHours(
        new Date(t.resolved_at),
        new Date(t.created_at)
      );
      stats.totalTime += hours;
      if (hours <= slaTargetHours) stats.compliant++;
    }
    appStats.set(app, stats);
  });

  const topApplications: TopApplication[] = Array.from(appStats.entries())
    .map(([name, stats]) => ({
      name,
      requests: stats.count,
      avgApprovalTime: stats.total > 0 ? stats.totalTime / stats.total : 0,
      slaCompliance:
        stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 6);

  // Manager Performance - calculate from real resolved tickets
  const managerStats = new Map<
    string,
    { times: number[]; count: number; overdue: number; resolvedCount: number }
  >();

  // Calculate from resolved requests
  resolvedRequests.forEach((t) => {
    if (t.assignee && t.resolved_at && t.created_at) {
      const resolvedDate = parseDate(t.resolved_at);
      const createdDate = parseDate(t.created_at);

      if (!resolvedDate || !createdDate) {
        return;
      }

      const stats = managerStats.get(t.assignee) || {
        times: [],
        count: 0,
        overdue: 0,
        resolvedCount: 0,
      };
      const minutes = differenceInMinutes(resolvedDate, createdDate);
      if (minutes >= 0 && isFinite(minutes)) {
        // Convert minutes to hours for storage
        stats.times.push(minutes / 60);
        stats.resolvedCount++;
        managerStats.set(t.assignee, stats);
      }
    }
  });

  // Add pending/overdue counts
  pendingApprovals.forEach((approval) => {
    const stats = managerStats.get(approval.approver) || {
      times: [],
      count: 0,
      overdue: 0,
      resolvedCount: 0,
    };
    stats.count++;
    if (approval.status === "overdue" || approval.status === "breached") {
      stats.overdue++;
    }
    managerStats.set(approval.approver, stats);
  });

  // Build manager performance from real data only
  const managerPerformance: ManagerPerformance[] = Array.from(
    managerStats.entries()
  )
    .map(([manager, stats]) => ({
      manager,
      avgApprovalTime:
        stats.times.length > 0
          ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length
          : 0,
      requestCount: stats.count + stats.resolvedCount,
      overdueCount: stats.overdue,
      overduePercentage:
        stats.count + stats.resolvedCount > 0
          ? (stats.overdue / (stats.count + stats.resolvedCount)) * 100
          : 0,
    }))
    .filter((m) => m.requestCount > 0); // Only show managers with actual requests

  const slowestApprovers = [...managerPerformance]
    .filter((m) => m.avgApprovalTime > 0) // Only those with resolved requests
    .sort((a, b) => b.avgApprovalTime - a.avgApprovalTime)
    .slice(0, 5);
  const fastestApprovers = [...managerPerformance]
    .filter((m) => m.avgApprovalTime > 0)
    .sort((a, b) => a.avgApprovalTime - b.avgApprovalTime)
    .slice(0, 5);

  // Generate insights
  const insights: AccessRequestInsight[] = [];
  if (overdue > 0) {
    insights.push({
      id: "overdue-alert",
      title: `${overdue} approvals overdue >48h — risk of delayed onboarding`,
      description: `${overdue} access requests have exceeded the 48-hour threshold, potentially delaying employee onboarding.`,
      severity: overdue > 5 ? "high" : "medium",
      actions: [
        { label: "Notify Approvers", primary: true },
        { label: "Create IAM Ticket" },
      ],
    });
  }

  const topSlowApprover = slowestApprovers[0];
  if (topSlowApprover && topSlowApprover.avgApprovalTime > 48) {
    insights.push({
      id: "slow-approver",
      title: `Top slow approver: ${topSlowApprover.manager} (avg ${topSlowApprover.avgApprovalTime}h) — suggest manager coaching`,
      description: `${topSlowApprover.manager} has an average approval time of ${topSlowApprover.avgApprovalTime} hours with ${topSlowApprover.overdueCount} overdue requests.`,
      severity: "medium",
      actions: [
        { label: "Send Reminder", primary: true },
        { label: "Schedule Auto-Reminder" },
      ],
    });
  }

  // Check for trending apps
  const topApp = topApplications[0];
  if (topApp && topApp.requests > 15) {
    insights.push({
      id: "trending-app",
      title: `${topApp.name} approvals trending +40% week-over-week`,
      description: `${
        topApp.name
      } access requests increased significantly this week; ${
        pendingApprovals.filter((a) => a.application === topApp.name).length
      } requests pending >48h.`,
      severity: "low",
      actions: [
        { label: "Notify Approvers", primary: true },
        { label: "Create IAM Ticket" },
      ],
    });
  }

  // Generate trend arrays for sparklines (last 7 days)
  const generateTrend = (
    data: AccessRequestTrendData[],
    key: keyof AccessRequestTrendData
  ): number[] => {
    return data.slice(-7).map((d) => (typeof d[key] === "number" ? d[key] : 0));
  };

  // Calculate daily avg approval time and SLA compliance trends
  const avgApprovalTimeTrend: (number | null)[] = [];
  const slaComplianceTrend: (number | null)[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = subDays(now, i);
    const dayResolved = accessRequests.filter((t) => {
      if (t.status !== "resolved" && t.status !== "closed") return false;
      if (!t.resolved_at) return false;
      const resolvedDate = new Date(t.resolved_at);
      return format(resolvedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    });

    if (dayResolved.length > 0) {
      let totalTime = 0;
      let compliant = 0;
      let validCount = 0;
      dayResolved.forEach((t) => {
        const resolvedDate = parseDate(t.resolved_at);
        const createdDate = parseDate(t.created_at);

        if (!resolvedDate || !createdDate) {
          return;
        }

        const minutes = differenceInMinutes(resolvedDate, createdDate);
        if (minutes >= 0 && isFinite(minutes)) {
          const hours = minutes / 60;
          totalTime += hours;
          validCount++;
          if (hours <= slaTargetHours) compliant++;
        }
      });
      if (validCount > 0) {
        avgApprovalTimeTrend.push(
          Math.round((totalTime / validCount) * 10) / 10
        );
        slaComplianceTrend.push(
          Math.round((compliant / validCount) * 100 * 10) / 10
        );
      } else {
        avgApprovalTimeTrend.push(null);
        slaComplianceTrend.push(null);
      }
      slaComplianceTrend.push(
        Math.round((compliant / dayResolved.length) * 100 * 10) / 10
      );
    } else {
      avgApprovalTimeTrend.push(null);
      slaComplianceTrend.push(null);
    }
  }

  // Calculate deltas
  const calculateDelta = (
    current: number | null,
    previous: number | null
  ): number | null => {
    if (current === null && previous === null) return null;
    if (current === null) return null;
    if (previous === null) return current > 0 ? 100 : null;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const kpis: AccessRequestKPI = {
    pending,
    avgApprovalTime:
      avgApprovalTime !== null ? Math.round(avgApprovalTime * 10) / 10 : null,
    slaCompliance:
      slaCompliance !== null ? Math.round(slaCompliance * 10) / 10 : null,
    overdue,
    pendingDelta: pending - previousPending,
    avgApprovalTimeDelta: calculateDelta(avgApprovalTime, prevAvgApprovalTime),
    slaComplianceDelta: calculateDelta(slaCompliance, prevSlaCompliance),
    overdueDelta: overdue - prevOverdue,
    pendingTrend: generateTrend(trendData, "volume"),
    avgApprovalTimeTrend,
    slaComplianceTrend,
    overdueTrend: generateTrend(trendData, "volume").map((v) => {
      // Estimate overdue based on volume (rough approximation)
      return Math.floor(v * 0.1);
    }),
  };

  // Calculate automation recommendations based on real metrics
  const automationRecommendations: AutomationRecommendation[] = [];

  // 1. Auto-remind after 24h
  const nearSLABreaches = pendingApprovals.filter(
    (a) => a.timeRemaining && a.timeRemaining < 12 && a.timeRemaining > 0
  ).length;
  const recommendAutoRemind = overdue > 0 || nearSLABreaches >= 2;
  automationRecommendations.push({
    id: "auto-remind-24h",
    name: "Auto-remind after 24h",
    description:
      "Automatically send reminder notifications to approvers for requests pending over 24 hours",
    recommended: recommendAutoRemind,
    reason: recommendAutoRemind
      ? overdue > 0
        ? `${overdue} overdue request${overdue > 1 ? "s" : ""} detected`
        : `${nearSLABreaches} request${
            nearSLABreaches > 1 ? "s" : ""
          } approaching SLA deadline`
      : "No pending requests at risk currently",
    potentialImpact: recommendAutoRemind
      ? `Could prevent ${Math.max(overdue, nearSLABreaches)} SLA breaches`
      : "Minimal impact with current metrics",
    riskLevel: "low",
  });

  // 2. Escalate after 48h
  const breachedCount = pendingApprovals.filter(
    (a) => a.status === "breached"
  ).length;
  const highOverduePercentage = slowestApprovers.some(
    (m) => m.overduePercentage > 30
  );
  const recommendAutoEscalate = breachedCount > 0 || highOverduePercentage;
  automationRecommendations.push({
    id: "auto-escalate-48h",
    name: "Escalate after 48h",
    description:
      "Automatically escalate requests to senior management if not approved within 48 hours",
    recommended: recommendAutoEscalate,
    reason: recommendAutoEscalate
      ? breachedCount > 0
        ? `${breachedCount} severely breached request${
            breachedCount > 1 ? "s" : ""
          } need escalation`
        : "Some approvers have high overdue rates (>30%)"
      : "No escalation needed with current performance",
    potentialImpact: recommendAutoEscalate
      ? `Could reduce overdue % by escalating ${
          breachedCount || overdue
        } request${(breachedCount || overdue) > 1 ? "s" : ""}`
      : "Not needed currently",
    riskLevel: "medium",
  });

  // 3. Auto-approve after 72h
  const lowRiskApps = topApplications.filter(
    (app) => app.slaCompliance >= 95 && app.requests >= 3
  );
  const hasReliableApprovers =
    fastestApprovers.length > 0 &&
    fastestApprovers.every((m) => m.overduePercentage < 5);
  const recommendAutoApprove =
    lowRiskApps.length >= 2 &&
    hasReliableApprovers &&
    slaCompliance !== null &&
    slaCompliance >= 90;
  automationRecommendations.push({
    id: "auto-approve-72h",
    name: "Auto-approve after 72h",
    description:
      "Auto-approve low-risk applications after 72h for requests with no approver response",
    recommended: recommendAutoApprove,
    reason: recommendAutoApprove
      ? `${lowRiskApps.length} app${
          lowRiskApps.length > 1 ? "s" : ""
        } have 95%+ SLA compliance with reliable approval history`
      : slaCompliance && slaCompliance < 90
      ? "Overall SLA compliance too low (<90%) for safe auto-approval"
      : lowRiskApps.length < 2
      ? "Not enough apps with proven reliability (need 2+ with 95%+ SLA)"
      : "Need more reliable approver performance data",
    potentialImpact: recommendAutoApprove
      ? `Could auto-approve ~${lowRiskApps.reduce(
          (sum, app) => sum + app.requests,
          0
        )} low-risk requests per month`
      : "Requires better baseline performance first",
    riskLevel: "high",
  });

  return {
    kpis,
    trendData,
    topApplications,
    slowestApprovers,
    fastestApprovers,
    pendingApprovals,
    insights,
    automationRecommendations,
  };
}

// Generate Live Events from real tickets
export function generateLiveEventsFromTickets(
  tickets: Ticket[],
  since?: Date
): LiveEvent[] {
  const cutoff = since || subDays(new Date(), 7); // Default to last 7 days
  const now = new Date();
  const events: LiveEvent[] = [];

  tickets.forEach((ticket) => {
    const createdDate = new Date(ticket.created_at);
    const updatedDate = new Date(ticket.updated_at);

    // Skip tickets outside the time range
    if (createdDate < cutoff && updatedDate < cutoff) {
      return;
    }

    // 1. Ticket Created Event
    if (createdDate >= cutoff) {
      events.push({
        id: `event-created-${ticket.id}`,
        type: "ticket_created",
        timestamp: ticket.created_at,
        ticketId: ticket.id,
        actor: ticket.user_name || "Unknown",
        description: `New ticket created by ${
          ticket.user_name || "Unknown"
        }: "${ticket.title}"`,
        headline: `New ticket created by ${ticket.user_name || "Unknown"}: "${
          ticket.title
        }"`,
        details: `Ticket ${ticket.id} assigned to ${
          ticket.suggested_team || "Unassigned"
        } team`,
        category: "tickets",
        severity:
          ticket.priority === "high"
            ? "high"
            : ticket.priority === "medium"
            ? "medium"
            : "low",
      });
    }

    // 2. Ticket Assigned Event (if assignee exists and was set recently)
    if (ticket.assignee && updatedDate >= cutoff && updatedDate > createdDate) {
      events.push({
        id: `event-assigned-${ticket.id}-${updatedDate.getTime()}`,
        type: "ticket_assigned",
        timestamp: ticket.updated_at,
        ticketId: ticket.id,
        actor: "System",
        description: `Ticket ${ticket.id} assigned to ${ticket.assignee}`,
        headline: `Ticket ${ticket.id} assigned to ${ticket.assignee}`,
        details: `${ticket.suggested_team || "Team"} team`,
        category: "tickets",
        severity: "low",
      });
    }

    // 3. Ticket Resolved Event
    if (ticket.resolved_at) {
      const resolvedDate = new Date(ticket.resolved_at);
      if (resolvedDate >= cutoff) {
        events.push({
          id: `event-resolved-${ticket.id}`,
          type: "ticket_resolved",
          timestamp: ticket.resolved_at,
          ticketId: ticket.id,
          actor: ticket.assignee || ticket.suggested_team || "System",
          description: `Ticket ${ticket.id} resolved by ${
            ticket.assignee || ticket.suggested_team || "System"
          }`,
          headline: `Ticket ${ticket.id} resolved by ${
            ticket.assignee || ticket.suggested_team || "System"
          }`,
          details: ticket.collected_details?.resolution
            ? String(ticket.collected_details.resolution)
            : `Issue resolved: ${ticket.title}`,
          category: "tickets",
          severity: "low",
        });
      }
    }

    // 4. Access Request Events (for access_request type tickets)
    if (ticket.ticket_type === "access_request") {
      // Access request submitted
      if (createdDate >= cutoff) {
        events.push({
          id: `event-ar-submitted-${ticket.id}`,
          type: "access_request_submitted",
          timestamp: ticket.created_at,
          ticketId: ticket.id,
          requestId: `AR-${ticket.id.slice(-6)}`,
          actor: ticket.user_name || "Unknown",
          description: `Access request ${ticket.id} submitted for ${
            ticket.app_or_system || "application"
          }`,
          headline: `Access request ${ticket.id} submitted for ${
            ticket.app_or_system || "application"
          }`,
          details: `Requested by ${ticket.user_name || "Unknown"}`,
          category: "access",
          severity: ticket.priority === "high" ? "medium" : "low",
        });
      }

      // Access request approved (if resolved)
      if (ticket.resolved_at && ticket.status === "resolved") {
        const resolvedDate = new Date(ticket.resolved_at);
        if (resolvedDate >= cutoff) {
          events.push({
            id: `event-ar-approved-${ticket.id}`,
            type: "access_request_approved",
            timestamp: ticket.resolved_at,
            ticketId: ticket.id,
            requestId: `AR-${ticket.id.slice(-6)}`,
            actor: ticket.assignee || "System",
            description: `Access request ${ticket.id} approved by ${
              ticket.assignee || "System"
            }`,
            headline: `Access request ${ticket.id} approved by ${
              ticket.assignee || "System"
            }`,
            details: `${
              ticket.app_or_system || "Application"
            } access granted for ${ticket.user_name || "user"}`,
            category: "access",
            severity: "low",
          });
        }
      }
    }

    // 5. SLA Warning/Breach Events
    if (ticket.sla_due_at) {
      const slaDueDate = new Date(ticket.sla_due_at);
      const hoursUntilSLA = differenceInHours(slaDueDate, now);

      // SLA Warning (within 2 hours of SLA)
      if (
        hoursUntilSLA > 0 &&
        hoursUntilSLA <= 2 &&
        ticket.status !== "resolved" &&
        ticket.status !== "closed"
      ) {
        events.push({
          id: `event-sla-warning-${ticket.id}-${now.getTime()}`,
          type: "sla_warning",
          timestamp: now.toISOString(),
          ticketId: ticket.id,
          actor: "System",
          description: `SLA warning: ${ticket.id} nearing SLA in ${Math.round(
            hoursUntilSLA * 60
          )}m`,
          headline: `SLA warning: ${ticket.id} nearing SLA in ${Math.round(
            hoursUntilSLA * 60
          )}m`,
          details: "Ticket will breach SLA threshold if not resolved soon",
          category: "sla",
          severity: "high",
        });
      }

      // SLA Breached
      if (
        isAfter(now, slaDueDate) &&
        ticket.status !== "resolved" &&
        ticket.status !== "closed"
      ) {
        const hoursOverdue = differenceInHours(now, slaDueDate);
        events.push({
          id: `event-sla-breach-${ticket.id}-${now.getTime()}`,
          type: "sla_breached",
          timestamp: slaDueDate.toISOString(),
          ticketId: ticket.id,
          actor: "System",
          description: `SLA breached: ${ticket.id} exceeded SLA threshold`,
          headline: `SLA breached: ${ticket.id} exceeded SLA threshold`,
          details: `Ticket unresolved for ${Math.round(
            hoursOverdue
          )} hours (SLA: ${format(slaDueDate, "MMM d, h:mm a")})`,
          category: "sla",
          severity: "critical",
        });
      }
    }

    // 6. Integration Events (from external_ids)
    if (ticket.external_ids && Object.keys(ticket.external_ids).length > 0) {
      Object.entries(ticket.external_ids).forEach(([key, value]) => {
        // Only create integration event if ticket was recently created/updated
        if (createdDate >= cutoff || updatedDate >= cutoff) {
          const integrationName =
            key === "servicenow"
              ? "ServiceNow"
              : key === "jira"
              ? "Jira"
              : key === "okta"
              ? "Okta"
              : key.charAt(0).toUpperCase() + key.slice(1);

          events.push({
            id: `event-integration-${ticket.id}-${key}`,
            type: "integration_event",
            timestamp:
              updatedDate >= cutoff ? ticket.updated_at : ticket.created_at,
            ticketId: ticket.id,
            actor: `${integrationName} Integration`,
            description: `Integration (${integrationName}): ${
              integrationName === "ServiceNow"
                ? "Incident"
                : integrationName === "Jira"
                ? "Issue"
                : "Record"
            } ${value} ${createdDate >= cutoff ? "created" : "linked"}`,
            headline: `Integration (${integrationName}): ${
              integrationName === "ServiceNow"
                ? "Incident"
                : integrationName === "Jira"
                ? "Issue"
                : "Record"
            } ${value} ${createdDate >= cutoff ? "created" : "linked"}`,
            details: `Linked to ticket ${ticket.id}`,
            category: "integrations",
            severity: "low",
            externalId: String(value),
          });
        }
      });
    }

    // 7. Ticket Updated Event (status changes)
    if (
      updatedDate >= cutoff &&
      updatedDate > createdDate &&
      ticket.status !== "resolved" &&
      ticket.status !== "closed"
    ) {
      events.push({
        id: `event-updated-${ticket.id}-${updatedDate.getTime()}`,
        type: "ticket_updated",
        timestamp: ticket.updated_at,
        ticketId: ticket.id,
        actor: ticket.assignee || ticket.suggested_team || "System",
        description: `Ticket ${
          ticket.id
        } updated: Status changed to ${ticket.status.replace("_", " ")}`,
        headline: `Ticket ${
          ticket.id
        } updated: Status changed to ${ticket.status.replace("_", " ")}`,
        details: `${ticket.suggested_team || "Team"} team`,
        category: "tickets",
        severity: "low",
      });
    }
  });

  // Sort by timestamp (newest first)
  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// Get Live Events (now generates from tickets)
export function getLiveEvents(since?: Date): LiveEvent[] {
  // Return only manually added events (from addLiveEvent)
  const cutoff = since || subDays(new Date(), 1);
  return liveEvents.filter((e) => new Date(e.timestamp) >= cutoff);
}

// Add Live Event
export function addLiveEvent(event: Omit<LiveEvent, "id" | "timestamp">) {
  const newEvent: LiveEvent = {
    ...event,
    id: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
  };
  liveEvents.unshift(newEvent);
  // Keep only last 100 events
  if (liveEvents.length > 100) {
    liveEvents = liveEvents.slice(0, 100);
  }
  return newEvent;
}

// Get Audit Logs
export function getAuditLogs(limit: number = 50): AuditLogEntry[] {
  return auditLogs.slice(0, limit);
}

// Append Audit Log
export function appendAuditLog(actor: string, action: string, details: string) {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    details,
  };
  auditLogs.unshift(entry);
  // Keep only last 500 entries
  if (auditLogs.length > 500) {
    auditLogs = auditLogs.slice(0, 500);
  }
  return entry;
}

// Replay Scenarios
export interface ReplayScenario {
  id: string;
  name: string;
  description: string;
  events: Array<Omit<LiveEvent, "id" | "timestamp">>;
}

export const replayScenarios: ReplayScenario[] = [
  {
    id: "vpn-outage",
    name: "Major VPN Outage",
    description:
      "Simulates a major VPN outage with multiple tickets and escalations",
    events: [
      {
        type: "ai_anomaly",
        actor: "AI System",
        description: "AI detected anomaly: VPN surge +200% (Forecasted)",
        headline: "AI detected anomaly: VPN surge +200% (Forecasted)",
        details:
          "Historical pattern detected: VPN spikes on Fridays during WFH",
        category: "ai_insights",
        severity: "high",
      },
      {
        type: "ticket_created",
        ticketId: "TKT-VPN-001",
        actor: "Sarah",
        description: 'New ticket created by Sarah: "VPN disconnecting"',
        headline: 'New ticket created by Sarah: "VPN disconnecting"',
        details: "Ticket TKT-VPN-001 assigned to Network team",
        category: "tickets",
        severity: "high",
      },
      {
        type: "ticket_created",
        ticketId: "TKT-VPN-002",
        actor: "Mike",
        description: 'New ticket created by Mike: "Cannot connect to VPN"',
        headline: 'New ticket created by Mike: "Cannot connect to VPN"',
        details: "Ticket TKT-VPN-002 assigned to Network team",
        category: "tickets",
        severity: "high",
      },
      {
        type: "sla_warning",
        ticketId: "TKT-VPN-001",
        actor: "System",
        description: "SLA warning: TKT-VPN-001 nearing SLA in 30m",
        headline: "SLA warning: TKT-VPN-001 nearing SLA in 30m",
        details: "Ticket will breach SLA threshold if not resolved soon",
        category: "sla",
        severity: "high",
      },
      {
        type: "ticket_updated",
        ticketId: "TKT-VPN-001",
        actor: "Network Team",
        description: "Ticket TKT-VPN-001 escalated to Network Lead",
        headline: "Ticket TKT-VPN-001 escalated to Network Lead",
        details: "Escalation due to multiple similar reports",
        category: "tickets",
        severity: "high",
      },
      {
        type: "external_id_created",
        ticketId: "TKT-VPN-001",
        actor: "System",
        description: "Incident created: INC-VPN-0001 (demo)",
        headline: "Incident created: INC-VPN-0001 (demo)",
        details: "Major incident created for VPN outage",
        category: "tickets",
        severity: "critical",
        externalId: "INC-VPN-0001",
      },
    ],
  },
  {
    id: "access-delay",
    name: "Access Approval Delay",
    description: "Simulates access request delays and auto-escalation",
    events: [
      {
        type: "access_request_submitted",
        requestId: "AR-DELAY-001",
        actor: "System",
        description: "Access request AR-DELAY-001 submitted for Jira",
        headline: "Access request AR-DELAY-001 submitted for Jira",
        details: "Requested by user@company.com",
        category: "access",
        severity: "low",
      },
      {
        type: "access_request_submitted",
        requestId: "AR-DELAY-002",
        actor: "System",
        description: "Access request AR-DELAY-002 submitted for Salesforce",
        headline: "Access request AR-DELAY-002 submitted for Salesforce",
        details: "Requested by user2@company.com",
        category: "access",
        severity: "low",
      },
      {
        type: "access_request_reminder",
        requestId: "AR-DELAY-001",
        actor: "System",
        description: "Reminder sent to approver John Manager for AR-DELAY-001",
        headline: "Reminder sent to approver John Manager",
        details: "Access request AR-DELAY-001 pending for 24+ hours",
        category: "access",
        severity: "low",
      },
      {
        type: "automation_fired",
        requestId: "AR-DELAY-001",
        actor: "System",
        description: "Auto-escalation: AR-DELAY-001 escalated to IAM team",
        headline: "Auto-escalation: AR-DELAY-001 escalated to IAM team",
        details: "Request pending >48h, auto-escalated per policy",
        category: "automations",
        severity: "medium",
      },
      {
        type: "access_request_approved",
        requestId: "AR-DELAY-001",
        actor: "John Manager",
        description: "Access request AR-DELAY-001 approved by John Manager",
        headline: "Access request AR-DELAY-001 approved by John Manager",
        details: "Jira access granted after escalation",
        category: "access",
        severity: "low",
      },
    ],
  },
  {
    id: "onboarding-spike",
    name: "Onboarding Spike",
    description: "Simulates a spike in access requests during onboarding",
    events: [
      {
        type: "access_request_submitted",
        requestId: "AR-ONB-001",
        actor: "System",
        description: "Access request AR-ONB-001 submitted for Jira",
        headline: "Access request AR-ONB-001 submitted for Jira",
        details: "New joiner: john.new@company.com",
        category: "access",
        severity: "low",
      },
      {
        type: "access_request_submitted",
        requestId: "AR-ONB-002",
        actor: "System",
        description: "Access request AR-ONB-002 submitted for Google Workspace",
        headline: "Access request AR-ONB-002 submitted for Google Workspace",
        details: "New joiner: jane.new@company.com",
        category: "access",
        severity: "low",
      },
      {
        type: "access_request_submitted",
        requestId: "AR-ONB-003",
        actor: "System",
        description: "Access request AR-ONB-003 submitted for GitHub",
        headline: "Access request AR-ONB-003 submitted for GitHub",
        details: "New joiner: bob.new@company.com",
        category: "access",
        severity: "low",
      },
      {
        type: "ai_insight",
        actor: "AI System",
        description: "AI Insight: Access request surge detected (+150%)",
        headline: "AI Insight: Access request surge detected (+150%)",
        details: "New joiner batch processed by HR yesterday",
        category: "ai_insights",
        severity: "medium",
      },
      {
        type: "automation_fired",
        actor: "System",
        description: "Suggested action: Enable auto-remind for access requests",
        headline: "Suggested action: Enable auto-remind for access requests",
        details: "High volume detected, auto-remind recommended",
        category: "automations",
        severity: "low",
      },
    ],
  },
  {
    id: "security-alert",
    name: "Security Alert",
    description: "Simulates a security alert with anomaly detection",
    events: [
      {
        type: "ai_anomaly",
        actor: "AI System",
        description: "AI detected anomaly: Suspicious login patterns detected",
        headline: "AI detected anomaly: Suspicious login patterns detected",
        details: "Multiple failed login attempts from unusual locations",
        category: "ai_insights",
        severity: "critical",
      },
      {
        type: "ticket_created",
        ticketId: "TKT-SEC-001",
        actor: "Security Team",
        description: "Security ticket TKT-SEC-001 created",
        headline: "Security ticket TKT-SEC-001 created",
        details: "Suspicious activity flagged by AI system",
        category: "tickets",
        severity: "critical",
      },
      {
        type: "ticket_assigned",
        ticketId: "TKT-SEC-001",
        actor: "System",
        description: "Ticket TKT-SEC-001 assigned to Security team",
        headline: "Ticket TKT-SEC-001 assigned to Security team",
        details: "High priority security incident",
        category: "tickets",
        severity: "critical",
      },
      {
        type: "external_id_created",
        ticketId: "TKT-SEC-001",
        actor: "System",
        description: "Incident created: INC-SEC-0001 (demo)",
        headline: "Incident created: INC-SEC-0001 (demo)",
        details: "Security incident escalated",
        category: "tickets",
        severity: "critical",
        externalId: "INC-SEC-0001",
      },
    ],
  },
  {
    id: "integration-sync",
    name: "Integration Sync",
    description: "Simulates external integration events",
    events: [
      {
        type: "integration_event",
        actor: "Jira Integration",
        description: "Integration (Jira): Issue JRA-2031 created externally",
        headline: "Integration (Jira): Issue JRA-2031 created externally",
        details: "External issue synced to ticket TKT-567",
        category: "integrations",
        severity: "low",
        externalId: "JRA-2031",
      },
      {
        type: "ticket_updated",
        ticketId: "TKT-567",
        actor: "Jira Integration",
        description: "Ticket TKT-567 updated: Linked to Jira issue JRA-2031",
        headline: "Ticket TKT-567 updated: Linked to Jira issue JRA-2031",
        details: "External ID synchronized",
        category: "integrations",
        severity: "low",
      },
      {
        type: "integration_event",
        actor: "ServiceNow Integration",
        description: "Integration (ServiceNow): Incident INC-001234 created",
        headline: "Integration (ServiceNow): Incident INC-001234 created",
        details: "Linked to ticket TKT-567",
        category: "integrations",
        severity: "low",
        externalId: "INC-001234",
      },
    ],
  },
  {
    id: "automation-demo",
    name: "Automation Demo",
    description: "Demonstrates automation capabilities",
    events: [
      {
        type: "automation_fired",
        requestId: "AR-AUTO-001",
        actor: "System",
        description: "Automation: Reminder sent to approver for AR-AUTO-001",
        headline: "Automation: Reminder sent to approver",
        details: "Access request pending for 24+ hours",
        category: "automations",
        severity: "low",
      },
      {
        type: "automation_fired",
        requestId: "AR-AUTO-002",
        actor: "System",
        description: "Auto-approve: AR-AUTO-002 auto-approved",
        headline: "Auto-approve: AR-AUTO-002 auto-approved",
        details: "Low-risk application request auto-approved after 72h",
        category: "automations",
        severity: "low",
      },
      {
        type: "automation_fired",
        requestId: "AR-AUTO-003",
        actor: "System",
        description: "Auto-escalation: AR-AUTO-003 escalated to manager",
        headline: "Auto-escalation: AR-AUTO-003 escalated to manager",
        details: "Request pending >48h, escalated per policy",
        category: "automations",
        severity: "medium",
      },
    ],
  },
];

// Replay a scenario
export function replayScenario(
  scenarioId: string,
  onEventAdded?: (event: LiveEvent) => void
): Promise<void> {
  return new Promise((resolve) => {
    const scenario = replayScenarios.find((s) => s.id === scenarioId);
    if (!scenario) {
      resolve();
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index >= scenario.events.length) {
        clearInterval(interval);
        resolve();
        return;
      }

      const event = addLiveEvent(scenario.events[index]);
      if (onEventAdded) {
        onEventAdded(event);
      }
      index++;
    }, 800); // 0.8s interval between events
  });
}
