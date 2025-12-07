// Analytics data store for enterprise admin console
// Provides aggregated metrics and analytics data

import { Ticket } from "./ticket-types"
import {
  calculateMTTR,
  calculateFirstResponseTime,
  calculateSLACompliance,
  checkSLABreach,
  getLifecycleStage,
} from "./ticket-types"
import { subDays, format } from "date-fns"

// KPI Metrics
export interface KPIMetrics {
  totalTickets: number
  open: number
  inProgress: number
  resolved: number
  mttr: number // Mean Time To Resolution in hours
  firstResponseTime: number // First Response Time in hours
  slaCompliance: number // Percentage
  csat: number // Customer Satisfaction percentage (mocked)
  // Deltas vs previous period
  totalTicketsDelta: number
  openDelta: number
  inProgressDelta: number
  resolvedDelta: number
  mttrDelta: number
  firstResponseTimeDelta: number
  slaComplianceDelta: number
  csatDelta: number
  // Trend data for sparklines (last 7 days)
  totalTicketsTrend: number[]
  openTrend: number[]
  inProgressTrend: number[]
  resolvedTrend: number[]
  mttrTrend: number[]
  firstResponseTimeTrend: number[]
  slaComplianceTrend: number[]
  csatTrend: number[]
}

// SLA Funnel Data
export interface SLAFunnelData {
  priority: string
  total: number
  meetingSLA: number
  breached: number
  slaPercentage: number
  breachedTickets: Ticket[]
}

// Top Issue
export interface TopIssue {
  issue: string
  count: number
  trend: number // Percentage change
  sampleTicketIds: string[]
  suggestedKBArticle?: string
  category: string
}

// Team Performance
export interface TeamPerformance {
  team: string
  queueSize: number
  avgFirstResponse: number // hours
  avgResolution: number // hours
  backlog: number
  loadScore: "low" | "medium" | "high"
  agents: AgentPerformance[]
}

export interface AgentPerformance {
  name: string
  ticketsAssigned: number
  ticketsResolved: number
  avgHandleTime: number // hours
  reopenRate: number // percentage
  currentWorkload: "low" | "medium" | "high"
}

// Lifecycle Funnel
export interface LifecycleStageData {
  stage: string
  count: number
  conversionRate: number // Percentage from previous stage
  medianTime: number // hours
  tickets: Ticket[]
}

// Forecast Data
export interface ForecastData {
  date: string
  predictedCount: number
  confidenceLower: number
  confidenceUpper: number
  anomalyFlag: boolean
  anomalyReason?: string
  // Enhanced anomaly details
  anomalyType?: "forecasted" | "detected" // forecasted = future risk, detected = historical/real-time
  anomalyHeadline?: string // Short headline (1 line)
  anomalyReasons?: string[] // 1-3 short reason bullets
  anomalyConfidence?: "low" | "medium" | "high" // Model confidence
  anomalyImpact?: "low" | "medium" | "high" // Impact level
  anomalyActions?: Array<{ label: string; primary?: boolean }> // Suggested actions
  anomalyProvenance?: string // Data sources used
}

// Live Event
export interface LiveEvent {
  id: string
  type: "ticket_created" | "ticket_updated" | "sla_breached" | "external_id_created" | "approval_pending"
  timestamp: string
  ticketId?: string
  actor?: string
  description: string
  externalId?: string
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  details: string
}

// In-memory stores
let auditLogs: AuditLogEntry[] = []
let liveEvents: LiveEvent[] = []

// Get KPI Metrics
export function getKPIMetrics(
  tickets: Ticket[],
  startDate?: Date,
  endDate?: Date
): KPIMetrics {
  const now = endDate || new Date()
  const start = startDate || subDays(now, 7)
  const previousStart = subDays(start, 7)
  const previousEnd = start

  // Filter tickets by date range
  const filteredTickets = tickets.filter((t) => {
    const created = new Date(t.created_at)
    return created >= start && created <= now
  })

  const previousTickets = tickets.filter((t) => {
    const created = new Date(t.created_at)
    return created >= previousStart && created < previousEnd
  })

  // Calculate current metrics
  const totalTickets = filteredTickets.length
  const open = filteredTickets.filter((t) => t.status === "open").length
  const inProgress = filteredTickets.filter((t) => t.status === "in_progress").length
  const resolved = filteredTickets.filter((t) => t.status === "resolved" || t.status === "closed").length
  const mttr = calculateMTTR(filteredTickets)
  const firstResponseTime = calculateFirstResponseTime(filteredTickets)
  const slaCompliance = calculateSLACompliance(filteredTickets)
  const csat = 85 + Math.random() * 10 // Mocked CSAT between 85-95%

  // Calculate previous period metrics
  const prevTotal = previousTickets.length
  const prevOpen = previousTickets.filter((t) => t.status === "open").length
  const prevInProgress = previousTickets.filter((t) => t.status === "in_progress").length
  const prevResolved = previousTickets.filter((t) => t.status === "resolved" || t.status === "closed").length
  const prevMTTR = calculateMTTR(previousTickets)
  const prevFRT = calculateFirstResponseTime(previousTickets)
  const prevSLA = calculateSLACompliance(previousTickets)
  const prevCSAT = 85 + Math.random() * 10

  // Calculate deltas
  const calculateDelta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  // Generate trend data (last 7 days)
  const trendDays = 7
  const totalTicketsTrend: number[] = []
  const openTrend: number[] = []
  const inProgressTrend: number[] = []
  const resolvedTrend: number[] = []
  const mttrTrend: number[] = []
  const firstResponseTimeTrend: number[] = []
  const slaComplianceTrend: number[] = []
  const csatTrend: number[] = []

  for (let i = trendDays - 1; i >= 0; i--) {
    const dayStart = subDays(now, i + 1)
    const dayEnd = subDays(now, i)
    const dayTickets = tickets.filter((t) => {
      const created = new Date(t.created_at)
      return created >= dayStart && created < dayEnd
    })

    totalTicketsTrend.push(dayTickets.length)
    openTrend.push(dayTickets.filter((t) => t.status === "open").length)
    inProgressTrend.push(dayTickets.filter((t) => t.status === "in_progress").length)
    resolvedTrend.push(dayTickets.filter((t) => t.status === "resolved" || t.status === "closed").length)
    mttrTrend.push(calculateMTTR(dayTickets))
    firstResponseTimeTrend.push(calculateFirstResponseTime(dayTickets))
    slaComplianceTrend.push(calculateSLACompliance(dayTickets))
    csatTrend.push(85 + Math.random() * 10)
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
    totalTicketsDelta: calculateDelta(totalTickets, prevTotal),
    openDelta: calculateDelta(open, prevOpen),
    inProgressDelta: calculateDelta(inProgress, prevInProgress),
    resolvedDelta: calculateDelta(resolved, prevResolved),
    mttrDelta: calculateDelta(mttr, prevMTTR),
    firstResponseTimeDelta: calculateDelta(firstResponseTime, prevFRT),
    slaComplianceDelta: calculateDelta(slaCompliance, prevSLA),
    csatDelta: calculateDelta(csat, prevCSAT),
    totalTicketsTrend,
    openTrend,
    inProgressTrend,
    resolvedTrend,
    mttrTrend,
    firstResponseTimeTrend,
    slaComplianceTrend,
    csatTrend,
  }
}

// Get SLA Funnel Data
export function getSLAFunnel(tickets: Ticket[]): SLAFunnelData[] {
  const priorities = ["high", "medium", "low"] as const
  const result: SLAFunnelData[] = []

  for (const priority of priorities) {
    const priorityTickets = tickets.filter((t) => t.priority === priority)
    const total = priorityTickets.length
    const breached = priorityTickets.filter(checkSLABreach).length
    const meetingSLA = total - breached
    const slaPercentage = total > 0 ? (meetingSLA / total) * 100 : 100

    result.push({
      priority: priority.toUpperCase(),
      total,
      meetingSLA,
      breached,
      slaPercentage,
      breachedTickets: priorityTickets.filter(checkSLABreach),
    })
  }

  return result
}

// Get Top Issues (auto-grouped by title similarity)
export function getTopIssues(tickets: Ticket[], limit: number = 10): TopIssue[] {
  // Simple grouping by title keywords
  const issueMap = new Map<string, Ticket[]>()

  for (const ticket of tickets) {
    // Extract key words from title (simple approach)
    const words = ticket.title.toLowerCase().split(/\s+/)
    const keyWords = words.filter((w) => w.length > 4) // Filter short words
    const key = keyWords.slice(0, 3).join(" ") || ticket.title.toLowerCase()

    if (!issueMap.has(key)) {
      issueMap.set(key, [])
    }
    issueMap.get(key)!.push(ticket)
  }

  const issues: TopIssue[] = []

  for (const [key, issueTickets] of issueMap.entries()) {
    if (issueTickets.length < 2) continue // Only show issues with 2+ tickets

    const sorted = issueTickets.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const recent = sorted.slice(0, 7) // Last 7 days
    const older = sorted.slice(7) // Before that

    const recentCount = recent.length
    const olderCount = older.length
    const trend = olderCount > 0 ? ((recentCount - olderCount) / olderCount) * 100 : 0

    issues.push({
      issue: issueTickets[0].title.substring(0, 60) + (issueTickets[0].title.length > 60 ? "..." : ""),
      count: issueTickets.length,
      trend,
      sampleTicketIds: issueTickets.slice(0, 3).map((t) => t.id),
      suggestedKBArticle: `KB-${issueTickets[0].ticket_type.toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      category: issueTickets[0].ticket_type,
    })
  }

  return issues
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Get Team Performance
export function getTeamPerformance(tickets: Ticket[]): TeamPerformance[] {
  const teams = ["Network", "Endpoint Support", "Application Support", "IAM", "Security", "DevOps"] as const
  const agents = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Williams", "Charlie Brown"]

  const result: TeamPerformance[] = []

  for (const team of teams) {
    const teamTickets = tickets.filter((t) => t.suggested_team === team)
    const openTickets = teamTickets.filter((t) => t.status !== "resolved" && t.status !== "closed")
    const resolvedTickets = teamTickets.filter((t) => t.status === "resolved" || t.status === "closed")

    const avgFirstResponse = calculateFirstResponseTime(teamTickets)
    const avgResolution = calculateMTTR(teamTickets)
    const backlog = openTickets.length

    // Calculate load score
    let loadScore: "low" | "medium" | "high" = "low"
    if (backlog > 20) loadScore = "high"
    else if (backlog > 10) loadScore = "medium"

    // Mock agent performance
    const agentCount = Math.floor(Math.random() * 3) + 2 // 2-4 agents per team
    const teamAgents: AgentPerformance[] = []

    for (let i = 0; i < agentCount; i++) {
      const agentTickets = teamTickets.filter((t) => t.assignee === agents[i] || !t.assignee)
      const assigned = agentTickets.length
      const resolved = agentTickets.filter((t) => t.status === "resolved" || t.status === "closed").length
      const handleTime = calculateMTTR(agentTickets)
      const reopened = agentTickets.filter((t) => (t.reopened_count || 0) > 0).length
      const reopenRate = assigned > 0 ? (reopened / assigned) * 100 : 0

      let workload: "low" | "medium" | "high" = "low"
      if (assigned > 15) workload = "high"
      else if (assigned > 8) workload = "medium"

      teamAgents.push({
        name: agents[i] || `Agent ${i + 1}`,
        ticketsAssigned: assigned,
        ticketsResolved: resolved,
        avgHandleTime: handleTime,
        reopenRate,
        currentWorkload: workload,
      })
    }

    result.push({
      team,
      queueSize: openTickets.length,
      avgFirstResponse,
      avgResolution,
      backlog,
      loadScore,
      agents: teamAgents,
    })
  }

  return result
}

// Get Lifecycle Funnel
export function getLifecycleFunnel(tickets: Ticket[]): LifecycleStageData[] {
  const stages: LifecycleStageData[] = []
  const stageOrder: Array<"new" | "triage" | "in_progress" | "resolved" | "closed"> = [
    "new",
    "triage",
    "in_progress",
    "resolved",
    "closed",
  ]

  let previousCount = tickets.length

  for (const stage of stageOrder) {
    const stageTickets = tickets.filter((t) => getLifecycleStage(t) === stage)
    const count = stageTickets.length
    const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 0

    // Calculate median time in stage (mock for now)
    const medianTime = stageTickets.length > 0 ? Math.random() * 24 : 0 // Mock hours

    stages.push({
      stage,
      count,
      conversionRate,
      medianTime,
      tickets: stageTickets,
    })

    previousCount = count
  }

  return stages
}

// Get Forecast Data (mocked)
export function getForecast(days: number = 7): ForecastData[] {
  const forecast: ForecastData[] = []
  const baseCount = 10
  const now = new Date()

  // Seed example anomalies for demo
  // VPN anomaly: forecasted (future) - appears 3 days from now
  const vpnAnomalyDate = format(subDays(now, -3), "yyyy-MM-dd")
  // Access anomaly: detected (recently discovered, still relevant) - appears on day 1
  const accessAnomalyDate = format(subDays(now, -1), "yyyy-MM-dd") // Tomorrow (detected today, relevant for forecast)

  for (let i = 0; i < days; i++) {
    const date = format(subDays(now, -i - 1), "yyyy-MM-dd")
    let predicted = baseCount + Math.random() * 5
    const confidence = 2
    
    // Check if this date matches our seeded anomalies
    const isVpnAnomaly = date === vpnAnomalyDate
    const isAccessAnomaly = date === accessAnomalyDate

    if (isVpnAnomaly) {
      // VPN surge forecasted anomaly
      predicted = baseCount * 3 // 200% increase
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
        anomalyProvenance: "Based on 90 days of ticket history + scheduled change calendar + integration events",
      })
    } else if (isAccessAnomaly) {
      // Access request detected anomaly
      predicted = baseCount * 1.8 // 80% increase
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
        anomalyProvenance: "Based on 90 days of ticket history + scheduled change calendar + integration events",
      })
    } else {
      // Normal forecast
      forecast.push({
        date,
        predictedCount: Math.round(predicted),
        confidenceLower: Math.round(predicted - confidence),
        confidenceUpper: Math.round(predicted + confidence),
        anomalyFlag: false,
      })
    }
  }

  return forecast
}

// Get Asset Data (will be enhanced with mock-assets)
export function getAssetData(assetId: string, tickets: Ticket[]) {
  const assetTickets = tickets.filter((t) => t.asset_id === assetId)
  return {
    ticketCount: assetTickets.length,
    tickets: assetTickets,
  }
}

// Get Access Request Analytics
export function getAccessRequestAnalytics(tickets: Ticket[]) {
  const accessRequests = tickets.filter((t) => t.ticket_type === "access_request")
  const pending = accessRequests.filter((t) => t.status !== "resolved" && t.status !== "closed").length

  // Mock approval time
  const avgApprovalTime = 24 + Math.random() * 48 // 24-72 hours

  // Volume by application (mock)
  const volumeByApp = {
    Okta: Math.floor(accessRequests.length * 0.4),
    "Google Workspace": Math.floor(accessRequests.length * 0.35),
    Other: accessRequests.length - Math.floor(accessRequests.length * 0.75),
  }

  // Requests by manager (mock)
  const requestsByManager = [
    { manager: "John Manager", count: Math.floor(accessRequests.length * 0.3) },
    { manager: "Jane Director", count: Math.floor(accessRequests.length * 0.25) },
    { manager: "Bob VP", count: Math.floor(accessRequests.length * 0.2) },
  ]

  return {
    pending,
    avgApprovalTime,
    volumeByApp,
    requestsByManager,
    total: accessRequests.length,
  }
}

// Get Live Events
export function getLiveEvents(since?: Date): LiveEvent[] {
  const cutoff = since || subDays(new Date(), 1)
  return liveEvents.filter((e) => new Date(e.timestamp) >= cutoff)
}

// Add Live Event
export function addLiveEvent(event: Omit<LiveEvent, "id" | "timestamp">) {
  const newEvent: LiveEvent = {
    ...event,
    id: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
  }
  liveEvents.unshift(newEvent)
  // Keep only last 100 events
  if (liveEvents.length > 100) {
    liveEvents = liveEvents.slice(0, 100)
  }
  return newEvent
}

// Get Audit Logs
export function getAuditLogs(limit: number = 50): AuditLogEntry[] {
  return auditLogs.slice(0, limit)
}

// Append Audit Log
export function appendAuditLog(actor: string, action: string, details: string) {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    details,
  }
  auditLogs.unshift(entry)
  // Keep only last 500 entries
  if (auditLogs.length > 500) {
    auditLogs = auditLogs.slice(0, 500)
  }
  return entry
}

