"use client"

import * as React from "react"
import { HelpCircle, TrendingUp, Users, Activity } from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TeamPerformance } from "@/lib/analytics-store"
import { Ticket } from "@/lib/ticket-types"
import { calculateSLACompliance } from "@/lib/ticket-types"

interface TeamPerformanceProps {
  data: TeamPerformance[]
  tickets?: Ticket[] // Optional: for filter-responsive calculations
  filters?: {
    startDate?: string
    endDate?: string
    team?: string
    priority?: string
    category?: string
    assignee?: string
    slaStatus?: string
    source?: string
  }
  onReassign?: (team: string, agent: string) => void
}

function LoadScoreBadge({ score }: { score: "low" | "medium" | "high" }) {
  const colors = {
    low: "bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-400",
    medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400",
    high: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive",
  }

  return (
    <Badge
      variant="outline"
      className={`text-xs px-2 py-0.5 font-medium ${colors[score]}`}
    >
      {score.charAt(0).toUpperCase() + score.slice(1)}
    </Badge>
  )
}

function TeamSummaryCard({
  team,
  isExpanded,
  onToggle,
  tickets,
}: {
  team: TeamPerformance
  isExpanded: boolean
  onToggle: () => void
  tickets?: Ticket[]
}) {
  // Calculate SLA compliance for this team
  const teamTickets = tickets?.filter((t) => t.suggested_team === team.team) || []
  const slaCompliance = teamTickets.length > 0 
    ? calculateSLACompliance(teamTickets)
    : 100

  return (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="px-4 py-2">
        <div className="flex flex-col gap-2.5">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{team.team}</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onToggle}
            >
              {isExpanded ? "Hide" : "Details"}
            </Button>
          </div>

          {/* Metrics - Clean Layout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Queue Size</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">Active open tickets assigned to this team</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-base font-semibold tabular-nums">{team.queueSize}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Backlog</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">Tickets pending beyond expected time or SLA threshold</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-base font-semibold tabular-nums">{team.backlog}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">SLA Compliance</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">% of tickets resolved within SLA target for this team</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-base font-semibold tabular-nums">{slaCompliance.toFixed(1)}%</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Load Score</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Overall workload health computed from queue size, backlog, and SLA trends.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center">
                <LoadScoreBadge score={team.loadScore} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TeamDetailsPanel({
  team,
  tickets,
}: {
  team: TeamPerformance
  tickets?: Ticket[]
}) {
  const teamTickets = tickets?.filter((t) => t.suggested_team === team.team) || []
  const slaCompliance = teamTickets.length > 0 
    ? calculateSLACompliance(teamTickets)
    : 100

  // Calculate ticket distribution by category
  const categoryCounts = teamTickets.reduce((acc, ticket) => {
    const category = ticket.ticket_type || "unknown"
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Get last 5 activity events (mock for now - in real app, this would come from activity log)
  const recentActivities = [
    { time: "2h ago", action: "Ticket resolved", ticket: "TKT-001" },
    { time: "4h ago", action: "Ticket assigned", ticket: "TKT-002" },
    { time: "6h ago", action: "Ticket created", ticket: "TKT-003" },
    { time: "1d ago", action: "Ticket updated", ticket: "TKT-004" },
    { time: "1d ago", action: "Ticket resolved", ticket: "TKT-005" },
  ]

  // Backlog breakdown by age
  const backlogTickets = teamTickets.filter(
    (t) => t.status !== "resolved" && t.status !== "closed"
  )
  const now = new Date()
  const backlogBreakdown = {
    "0-24h": backlogTickets.filter((t) => {
      const created = new Date(t.created_at)
      const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
      return hours <= 24
    }).length,
    "1-3d": backlogTickets.filter((t) => {
      const created = new Date(t.created_at)
      const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
      return hours > 24 && hours <= 72
    }).length,
    "3-7d": backlogTickets.filter((t) => {
      const created = new Date(t.created_at)
      const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
      return hours > 72 && hours <= 168
    }).length,
    "7d+": backlogTickets.filter((t) => {
      const created = new Date(t.created_at)
      const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
      return hours > 168
    }).length,
  }

  return (
    <Card className="mt-2 border-t-0 rounded-t-none bg-muted/30">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Metrics */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-sm mb-3">Team Detailed Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Avg First Response</div>
                  <div className="text-lg font-semibold tabular-nums">
                    {team.avgFirstResponse.toFixed(1)}h
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Avg Resolution</div>
                  <div className="text-lg font-semibold tabular-nums">
                    {team.avgResolution.toFixed(1)}h
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">SLA Compliance</div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold tabular-nums">
                      {slaCompliance.toFixed(1)}%
                    </div>
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Last 7 days</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">Ticket Distribution</h4>
              <div className="space-y-2">
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {category.replace("_", " ")}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(categoryCounts).length === 0 && (
                  <div className="text-sm text-muted-foreground">No tickets</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Activity & Backlog */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-sm mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {recentActivities.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-md bg-background"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{activity.action}</span>
                      <span className="font-medium">{activity.ticket}</span>
                    </div>
                    <span className="text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">Backlog Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(backlogBreakdown).map(([age, count]) => (
                  <div key={age} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{age}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Agents Table */}
        {team.agents.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agents
            </h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-9">Agent</TableHead>
                    <TableHead className="h-9">Assigned</TableHead>
                    <TableHead className="h-9">Resolved</TableHead>
                    <TableHead className="h-9">Handle Time</TableHead>
                    <TableHead className="h-9">Reopen Rate</TableHead>
                    <TableHead className="h-9">Workload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.agents.map((agent, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-sm">{agent.name}</TableCell>
                      <TableCell className="text-sm">{agent.ticketsAssigned}</TableCell>
                      <TableCell className="text-sm">{agent.ticketsResolved}</TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {agent.avgHandleTime.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {agent.reopenRate.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <LoadScoreBadge score={agent.currentWorkload} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TeamPerformanceComponent({
  data,
  tickets,
  filters,
  onReassign,
}: TeamPerformanceProps) {
  const [expandedTeam, setExpandedTeam] = React.useState<string | null>(null)

  const handleToggle = (team: string) => {
    setExpandedTeam(expandedTeam === team ? null : team)
  }

  const hasActiveFilters = filters && Object.values(filters).some(
    (v) => v && v !== "all" && v !== ""
  )

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold mb-1">Team Performance</h2>
        <p className="text-sm text-muted-foreground">
          Overview of workload, backlog, and operational health across all IT teams.
          {hasActiveFilters && (
            <span className="ml-2 text-xs">
              (Filtered view)
            </span>
          )}
        </p>
      </div>

      {/* Team Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((team) => {
          const isExpanded = expandedTeam === team.team

          return (
            <Collapsible
              key={team.team}
              open={isExpanded}
              onOpenChange={() => handleToggle(team.team)}
              className={isExpanded ? "col-span-full" : ""}
            >
              <div className={isExpanded ? "" : ""}>
                <TeamSummaryCard
                  team={team}
                  isExpanded={isExpanded}
                  onToggle={() => handleToggle(team.team)}
                  tickets={tickets}
                />
              </div>
              <CollapsibleContent className="mt-3">
                <TeamDetailsPanel team={team} tickets={tickets} />
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
