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
  const slaComplianceTrend: number[] = [];
  const csatTrend: number[] = [];

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
    slaComplianceTrend.push(calculateSLACompliance(dayTickets));

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

  return {
    totalTickets,
    open,
    inProgress,
    resolved,
    mttr,
    firstResponseTime,
    slaCompliance,
    csat,
    totalTicketsDelta: calculateDelta(filteredTotal, prevTotal),
    openDelta: calculateDelta(filteredOpen, prevOpen),
    inProgressDelta: calculateDelta(filteredInProgress, prevInProgress),
    resolvedDelta: calculateDelta(filteredResolved, prevResolved),
    mttrDelta: calculateDelta(mttr, prevMTTR),
    firstResponseTimeDelta: calculateDelta(firstResponseTime, prevFRT),
    slaComplianceDelta: calculateDelta(slaCompliance ?? null, prevSLA ?? null),
    csatDelta: calculateDelta(csat ?? null, prevCSAT ?? null),
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

export interface AccessRequestAnalytics {
  kpis: AccessRequestKPI;
  trendData: AccessRequestTrendData[];
  topApplications: TopApplication[];
  slowestApprovers: ManagerPerformance[];
  fastestApprovers: ManagerPerformance[];
  pendingApprovals: PendingApproval[];
  insights: AccessRequestInsight[];
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
  const parseDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    try {
      // Handle MongoDB date format { $date: "..." }
      if (
        typeof dateValue === "object" &&
        dateValue !== null &&
        "$date" in dateValue
      ) {
        return new Date((dateValue as any).$date);
      }
      return new Date(dateValue);
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

      return {
        requestId: `AR-${t.id.slice(-6)}`,
        ticketId: t.id,
        requester: t.user_name || "Unknown",
        department: undefined, // Not stored in ticket
        application: t.app_or_system || "Unknown",
        requestedAt: t.created_at,
        approver: t.assignee || "Unassigned",
        slaDueAt: slaDueAt.toISOString(),
        status:
          timeOverdue > 48 ? "breached" : isOverdue ? "overdue" : "pending",
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

  return {
    kpis,
    trendData,
    topApplications,
    slowestApprovers,
    fastestApprovers,
    pendingApprovals,
    insights,
  };
}

// Seed initial demo events
function seedDemoEvents() {
  const now = new Date();
  const seeded: LiveEvent[] = [
    {
      id: "event-seed-1",
      type: "ticket_created",
      timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      ticketId: "TKT-567",
      actor: "Sarah",
      description: 'New ticket created by Sarah: "VPN disconnecting"',
      headline: 'New ticket created by Sarah: "VPN disconnecting"',
      details: "Ticket TKT-567 assigned to Network team",
      category: "tickets",
      severity: "medium",
    },
    {
      id: "event-seed-2",
      type: "ticket_assigned",
      timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      ticketId: "TKT-567",
      actor: "System",
      description: "Ticket TKT-567 assigned to Network team",
      headline: "Ticket TKT-567 assigned to Network team",
      category: "tickets",
      severity: "low",
    },
    {
      id: "event-seed-3",
      type: "sla_warning",
      timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
      ticketId: "TKT-VPN-002",
      actor: "System",
      description: "SLA warning: TKT-VPN-002 nearing SLA in 30m",
      headline: "SLA warning: TKT-VPN-002 nearing SLA in 30m",
      details: "Ticket will breach SLA threshold if not resolved soon",
      category: "sla",
      severity: "high",
    },
    {
      id: "event-seed-4",
      type: "access_request_approved",
      timestamp: new Date(now.getTime() - 12 * 60 * 1000).toISOString(), // 12 minutes ago
      requestId: "AR-123",
      actor: "John Manager",
      description: "Access request AR-123 approved by John Manager",
      headline: "Access request AR-123 approved by John Manager",
      details: "Jira access granted for user@company.com",
      category: "access",
      severity: "low",
    },
    {
      id: "event-seed-5",
      type: "automation_fired",
      timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      requestId: "AR-010",
      actor: "System",
      description:
        "Automation: Reminder sent to approver Helen Mirren (AR-010)",
      headline: "Automation: Reminder sent to approver Helen Mirren",
      details: "Access request AR-010 pending for 24+ hours",
      category: "automations",
      severity: "low",
    },
    {
      id: "event-seed-6",
      type: "ai_anomaly",
      timestamp: new Date(now.getTime() - 18 * 60 * 1000).toISOString(), // 18 minutes ago
      actor: "AI System",
      description: "AI detected anomaly: VPN surge +200% (Forecasted)",
      headline: "AI detected anomaly: VPN surge +200% (Forecasted)",
      details: "Historical pattern detected: VPN spikes on Fridays during WFH",
      category: "ai_insights",
      severity: "high",
    },
    {
      id: "event-seed-7",
      type: "integration_event",
      timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
      actor: "Okta Integration",
      description:
        "Integration (Okta): User added to Jira Developers group (demo)",
      headline: "Integration (Okta): User added to Jira Developers group",
      details: "User john.doe@company.com provisioned via Okta sync",
      category: "integrations",
      severity: "low",
      externalId: "OKTA-12345",
    },
    {
      id: "event-seed-8",
      type: "ticket_resolved",
      timestamp: new Date(now.getTime() - 40 * 60 * 1000).toISOString(), // 40 minutes ago
      ticketId: "TKT-123",
      actor: "Endpoint Support",
      description: "Ticket TKT-123 resolved by Endpoint Support",
      headline: "Ticket TKT-123 resolved by Endpoint Support",
      details: "Issue resolved: Laptop connectivity restored",
      category: "tickets",
      severity: "low",
    },
    {
      id: "event-seed-9",
      type: "access_request_submitted",
      timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      requestId: "AR-090",
      actor: "System",
      description: "Escalation: Access request AR-090 escalated to IAM team",
      headline: "Escalation: Access request AR-090 escalated to IAM team",
      details: "Request pending >48h, auto-escalated per policy",
      category: "access",
      severity: "medium",
    },
    {
      id: "event-seed-10",
      type: "automation_fired",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      requestId: "AR-SEED-001",
      actor: "System",
      description: "Auto-approve demo event: AR-SEED-001 auto-approved",
      headline: "Auto-approve: AR-SEED-001 auto-approved",
      details: "Low-risk application request auto-approved after 72h",
      category: "automations",
      severity: "low",
    },
    {
      id: "event-seed-11",
      type: "ticket_created",
      timestamp: subDays(now, 1).toISOString(),
      ticketId: "TKT-456",
      actor: "Mike Johnson",
      description: 'New ticket created by Mike Johnson: "Email not syncing"',
      headline: 'New ticket created by Mike Johnson: "Email not syncing"',
      details: "Ticket TKT-456 assigned to IT Helpdesk team",
      category: "tickets",
      severity: "medium",
    },
    {
      id: "event-seed-12",
      type: "sla_breached",
      timestamp: subDays(now, 1).toISOString(),
      ticketId: "TKT-789",
      actor: "System",
      description: "SLA breached: TKT-789 exceeded SLA threshold",
      headline: "SLA breached: TKT-789 exceeded SLA threshold",
      details: "Ticket unresolved for 25 hours (SLA: 24h)",
      category: "sla",
      severity: "critical",
    },
    {
      id: "event-seed-13",
      type: "integration_event",
      timestamp: subDays(now, 1).toISOString(),
      actor: "Jira Integration",
      description: "Integration (Jira): Issue JRA-2031 created externally",
      headline: "Integration (Jira): Issue JRA-2031 created externally",
      details: "Linked to ticket TKT-567",
      category: "integrations",
      severity: "low",
      externalId: "JRA-2031",
    },
    {
      id: "event-seed-14",
      type: "ai_insight",
      timestamp: subDays(now, 2).toISOString(),
      actor: "AI System",
      description: "AI Insight: Access request surge detected (+80%)",
      headline: "AI Insight: Access request surge detected (+80%)",
      details: "New joiner batch processed by HR yesterday",
      category: "ai_insights",
      severity: "medium",
    },
    {
      id: "event-seed-15",
      type: "access_request_reminder",
      timestamp: subDays(now, 2).toISOString(),
      requestId: "AR-045",
      actor: "System",
      description: "Reminder sent to approver Bob VP for AR-045",
      headline: "Reminder sent to approver Bob VP",
      details: "Access request AR-045 pending for 26 hours",
      category: "access",
      severity: "low",
    },
    {
      id: "event-seed-16",
      type: "ticket_updated",
      timestamp: subDays(now, 3).toISOString(),
      ticketId: "TKT-234",
      actor: "Network Team",
      description: "Ticket TKT-234 updated: Status changed to In Progress",
      headline: "Ticket TKT-234 updated: Status changed to In Progress",
      details: "Network team investigating connectivity issue",
      category: "tickets",
      severity: "low",
    },
    {
      id: "event-seed-17",
      type: "integration_event",
      timestamp: subDays(now, 4).toISOString(),
      actor: "ServiceNow Integration",
      description: "Integration (ServiceNow): Incident INC-001234 created",
      headline: "Integration (ServiceNow): Incident INC-001234 created",
      details: "Linked to ticket TKT-567",
      category: "integrations",
      severity: "low",
      externalId: "INC-001234",
    },
    {
      id: "event-seed-18",
      type: "automation_fired",
      timestamp: subDays(now, 5).toISOString(),
      actor: "System",
      description: "Automation: Auto-escalation triggered for AR-078",
      headline: "Automation: Auto-escalation triggered for AR-078",
      details: "Request pending >48h, escalated to manager",
      category: "automations",
      severity: "medium",
    },
    {
      id: "event-seed-19",
      type: "ai_anomaly",
      timestamp: subDays(now, 6).toISOString(),
      actor: "AI System",
      description: "AI detected anomaly: Access request surge detected (+80%)",
      headline: "AI detected anomaly: Access request surge detected (+80%)",
      details: "Approver delays observed in last 48h",
      category: "ai_insights",
      severity: "medium",
    },
    {
      id: "event-seed-20",
      type: "ticket_created",
      timestamp: subDays(now, 7).toISOString(),
      ticketId: "TKT-890",
      actor: "Lisa Chen",
      description: 'New ticket created by Lisa Chen: "Printer offline"',
      headline: 'New ticket created by Lisa Chen: "Printer offline"',
      details: "Ticket TKT-890 assigned to IT Helpdesk team",
      category: "tickets",
      severity: "low",
    },
  ];

  // Only seed if events array is empty
  if (liveEvents.length === 0) {
    liveEvents = seeded;
  }
}

// Initialize seeded events
seedDemoEvents();

// Get Live Events
export function getLiveEvents(since?: Date): LiveEvent[] {
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
