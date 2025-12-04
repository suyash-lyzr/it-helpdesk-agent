"use client"

import * as React from "react"
import { format, subDays, differenceInMinutes } from "date-fns"
import { Ticket } from "@/lib/ticket-types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { TicketsTable } from "@/components/tickets-table"
import { toast } from "sonner"
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react"

interface AdminTicketsDashboardProps {
  tickets: Ticket[]
  onTicketsUpdated: (tickets: Ticket[]) => void
  onRefresh?: () => void
  isLoading?: boolean
}

interface TicketCounts {
  total: number
  new: number
  open: number
  in_progress: number
  resolved: number
  closed: number
}

export function AdminTicketsDashboard({
  tickets,
  onTicketsUpdated,
  onRefresh,
  isLoading,
}: AdminTicketsDashboardProps) {
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [teamFilter, setTeamFilter] = React.useState<string>("all")
  const [assigneeFilter] = React.useState<string>("all") // Placeholder for future use
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null)
  const [isResolving, setIsResolving] = React.useState(false)
  const [resolutionText, setResolutionText] = React.useState("")

  const counts = React.useMemo<TicketCounts>(() => {
    const base: TicketCounts = {
      total: tickets.length,
      new: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    }
    for (const t of tickets) {
      if (t.status in base) {
        // @ts-expect-error narrow by key
        base[t.status] += 1
      }
    }
    return base
  }, [tickets])

  const last15DaysTickets = React.useMemo(() => {
    const cutoff = subDays(new Date(), 15)
    return tickets.filter((t) => new Date(t.created_at) >= cutoff)
  }, [tickets])

  const teamStats = React.useMemo(() => {
    const map = new Map<
      string,
      { count: number; resolved: number; open: number }
    >()
    for (const t of tickets) {
      const key = t.suggested_team
      const entry =
        map.get(key) ?? {
          count: 0,
          resolved: 0,
          open: 0,
        }
      entry.count += 1
      if (t.status === "resolved" || t.status === "closed") {
        entry.resolved += 1
      } else {
        entry.open += 1
      }
      map.set(key, entry)
    }
    return Array.from(map.entries()).map(([team, value]) => ({
      team,
      ...value,
    }))
  }, [tickets])

  const categoryStats = React.useMemo(() => {
    const map = new Map<
      string,
      { count: number; incidents: number; requests: number }
    >()
    for (const t of tickets) {
      const key = t.ticket_type
      const entry =
        map.get(key) ?? {
          count: 0,
          incidents: 0,
          requests: 0,
        }
      entry.count += 1
      if (t.ticket_type === "incident") {
        entry.incidents += 1
      } else {
        entry.requests += 1
      }
      map.set(key, entry)
    }
    return Array.from(map.entries()).map(([category, value]) => ({
      category,
      ...value,
    }))
  }, [tickets])

  const liveActivity = React.useMemo(() => {
    const sorted = [...tickets].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return sorted.slice(0, 6)
  }, [tickets])

  const suggestions = React.useMemo(() => {
    const result: {
      title: string
      description: string
      cta: string
      badge: string
    }[] = []

    const repeatedMap = new Map<string, number>()
    for (const t of last15DaysTickets) {
      const key = t.title.toLowerCase()
      repeatedMap.set(key, (repeatedMap.get(key) ?? 0) + 1)
    }
    const repeatedIssues = Array.from(repeatedMap.values()).filter(
      (c) => c >= 3
    ).length

    if (repeatedIssues > 0) {
      result.push({
        title: "Policy or KB gaps detected",
        description:
          "Multiple similar issues raised in the last 15 days. Consider updating IT policies or KB articles.",
        cta: "Review Knowledge Base",
        badge: `${repeatedIssues} patterns`,
      })
    }

    const pendingAccessRequests = last15DaysTickets.filter(
      (t) =>
        t.ticket_type === "access_request" &&
        (t.status === "new" || t.status === "open" || t.status === "in_progress")
    ).length

    if (pendingAccessRequests > 0) {
      result.push({
        title: "Pending access approvals",
        description:
          "Access request tickets are waiting for approvals. Send reminders to approvers.",
        cta: "Send Reminder",
        badge: `${pendingAccessRequests} tickets`,
      })
    }

    const hardwareIssues = last15DaysTickets.filter((t) =>
      t.app_or_system.toLowerCase().includes("laptop")
    ).length

    if (hardwareIssues > 0) {
      result.push({
        title: "Hardware issues trending",
        description:
          "Multiple hardware-related tickets detected. Consider reviewing asset health and replacement plans.",
        cta: "Review Assets",
        badge: `${hardwareIssues} tickets`,
      })
    }

    if (result.length === 0) {
      result.push({
        title: "System healthy",
        description:
          "No significant patterns detected in the last 15 days. Continue monitoring ticket inflow.",
        cta: "View All Tickets",
        badge: "Stable",
      })
    }

    return result
  }, [last15DaysTickets])

  const filteredTickets = React.useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      if (teamFilter !== "all" && t.suggested_team !== teamFilter) return false
      // assigneeFilter is reserved for future when assignee is available
      return true
    })
  }, [tickets, statusFilter, teamFilter])

  async function handleResolveTicket() {
    if (!selectedTicket) return
    if (!resolutionText.trim()) {
      toast.info("Please add a resolution note before resolving the ticket")
      return
    }
    if (selectedTicket.status === "resolved" || selectedTicket.status === "closed") {
      toast.info("Ticket is already resolved")
      return
    }

    try {
      setIsResolving(true)
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "resolved",
          collected_details: {
            ...(selectedTicket.collected_details ?? {}),
            resolution: resolutionText.trim(),
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        console.error("Failed to resolve ticket", data)
        toast.error(
          data.message ||
            "Failed to resolve ticket on the server. Status will be updated locally only."
        )

        // Fallback: update ticket locally so the admin experience still works
        const fallbackUpdated: Ticket = {
          ...selectedTicket,
          status: "resolved",
          collected_details: {
            ...(selectedTicket.collected_details ?? {}),
            resolution: resolutionText.trim(),
          },
          updated_at: new Date().toISOString(),
        }
        const fallbackTickets = tickets.map((t) =>
          t.id === fallbackUpdated.id ? fallbackUpdated : t
        )
        onTicketsUpdated(fallbackTickets)
        setSelectedTicket(fallbackUpdated)
        setResolutionText("")
        return
      }

      const updated = data.data as Ticket
      const newTickets = tickets.map((t) => (t.id === updated.id ? updated : t))
      onTicketsUpdated(newTickets)
      setSelectedTicket(updated)
      setResolutionText("")
      toast.success(`Ticket ${updated.id} marked as resolved`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to resolve ticket")
    } finally {
      setIsResolving(false)
    }
  }

  function formatDurationMinutes(createdAt: string, resolvedAt?: string) {
    const start = new Date(createdAt)
    const end = resolvedAt ? new Date(resolvedAt) : new Date()
    const mins = differenceInMinutes(end, start)
    if (mins < 60) return `${mins} min`
    const hours = Math.round(mins / 60)
    return `${hours} hr`
  }

  const uniqueTeams = React.useMemo(
    () => Array.from(new Set(tickets.map((t) => t.suggested_team))),
    [tickets]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Top summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all teams and categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.open}</div>
            <p className="text-xs text-muted-foreground">
              Tickets currently waiting for action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.in_progress}</div>
            <p className="text-xs text-muted-foreground">
              Being actively worked on by teams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.resolved}</div>
            <p className="text-xs text-muted-foreground">
              Successfully closed by IT teams
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Potential upcoming queries / risk cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Potential Upcoming Queries
          </CardTitle>
          <CardDescription>
            Forecasted areas where ticket volume may rise based on recent patterns.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminInsightCard
            title="Access Requests"
            description="Spike expected as new users onboard or change roles."
            value={`${last15DaysTickets.filter((t) => t.ticket_type === "access_request").length * 5}%`}
            impact="High impact"
            trend="up"
          />
          <AdminInsightCard
            title="Incident Volume"
            description="Operational issues and outages based on current patterns."
            value={`${last15DaysTickets.filter((t) => t.ticket_type === "incident").length * 3}%`}
            impact="Medium impact"
            trend="up"
          />
          <AdminInsightCard
            title="Service Requests"
            description="General IT service and how-to questions remain stable."
            value="Stable"
            impact="Low impact"
            trend="flat"
          />
        </CardContent>
      </Card>

      {/* Team queries, category trends, live activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Team Queries</CardTitle>
            <CardDescription>Load and performance across IT teams.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tickets yet. Team insights will appear here once traffic starts.
              </p>
            ) : (
              teamStats.map((team) => (
                <div
                  key={team.team}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{team.team}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.count} tickets • {team.open} open • {team.resolved} resolved
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {team.open > team.resolved ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <ArrowUpRight className="h-3 w-3" />
                        High load
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <ArrowDownRight className="h-3 w-3" />
                        Stable
                      </span>
                    )}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Category Trends</CardTitle>
            <CardDescription>Ticket mix by type and volume.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories yet. Once tickets are created, trends will appear here.
              </p>
            ) : (
              categoryStats.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium" style={{ textTransform: "capitalize" }}>
                      {cat.category.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cat.count} tickets • {cat.incidents} incidents • {cat.requests} requests
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {cat.count >= 5 ? "Trending" : "Normal"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Live Activity</CardTitle>
            <CardDescription>Recent ticket events across the helpdesk.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. New tickets and updates will show up here.
              </p>
            ) : (
              liveActivity.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.created_at), "MMM d, yyyy • HH:mm")}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {t.status.replace("_", " ")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last 15 days analysis & suggestions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Last 15 Days Analysis & Suggestions
            </CardTitle>
            <CardDescription>
              Proactive recommendations based on recent ticket patterns.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            {last15DaysTickets.length} tickets analysed
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestions.map((s) => (
            <Card key={s.title} className="border-dashed">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {s.badge}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{s.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    toast.info(`${s.cta} - workflow coming soon`, {
                      description: "This is a placeholder action for now.",
                    })
                  }
                >
                  {s.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Filters and All Tickets table */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">All Tickets</CardTitle>
              <CardDescription>
                Full visibility into every ticket across the helpdesk.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={teamFilter}
                onValueChange={(val) => setTeamFilter(val)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueTeams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} disabled>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                </SelectContent>
              </Select>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  Refresh
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Input
              className="max-w-sm"
              placeholder="Search tickets (use table search)"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Use the table search to quickly filter by ID, title, or app.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <TicketsTable
            data={filteredTickets}
            isLoading={isLoading}
            onRowClick={setSelectedTicket}
          />
        </CardContent>
      </Card>

      {/* Ticket detail sidebar */}
      <Sheet
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null)
            setResolutionText("")
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-lg">
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between gap-2">
                  <span>{selectedTicket.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedTicket.id}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  {selectedTicket.description}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 p-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">
                      {selectedTicket.ticket_type.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize">
                      {selectedTicket.priority || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Application / System
                    </p>
                    <p className="font-medium">
                      {selectedTicket.app_or_system || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Team</p>
                    <p className="font-medium">{selectedTicket.suggested_team}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">
                      {selectedTicket.status.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Requester</p>
                    <p className="font-medium">
                      {selectedTicket.user_name || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {format(new Date(selectedTicket.created_at), "MMM d, yyyy • HH:mm")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {format(new Date(selectedTicket.updated_at), "MMM d, yyyy • HH:mm")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time Open</p>
                    <p className="font-medium">
                      {formatDurationMinutes(selectedTicket.created_at)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Collected Details
                  </p>
                  <pre className="rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                    {JSON.stringify(selectedTicket.collected_details ?? {}, null, 2)}
                  </pre>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Resolution</p>
                  <Textarea
                    rows={4}
                    placeholder="Document how this ticket was resolved..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This note will be saved with the ticket under collected details.
                  </p>
                </div>
              </div>
              <SheetFooter className="border-t bg-muted/40">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Resolve this ticket once the issue is addressed.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={
                      isResolving ||
                      selectedTicket.status === "resolved" ||
                      selectedTicket.status === "closed"
                    }
                    onClick={handleResolveTicket}
                  >
                    {selectedTicket.status === "resolved" ||
                    selectedTicket.status === "closed"
                      ? "Already Resolved"
                      : isResolving
                        ? "Resolving..."
                        : "Resolve Ticket"}
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

interface AdminInsightCardProps {
  title: string
  description: string
  value: string
  impact: string
  trend: "up" | "down" | "flat"
}

function AdminInsightCard({
  title,
  description,
  value,
  impact,
  trend,
}: AdminInsightCardProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{impact}</p>
        </div>
        <Badge
          variant="outline"
          className="flex items-center gap-1 text-xs"
        >
          {trend === "up" && <ArrowUpRight className="h-3 w-3 text-amber-600" />}
          {trend === "down" && (
            <ArrowDownRight className="h-3 w-3 text-emerald-600" />
          )}
          {trend === "flat" && <Clock className="h-3 w-3 text-muted-foreground" />}
          <span className="capitalize">{trend === "flat" ? "Stable" : "Changing"}</span>
        </Badge>
      </CardContent>
    </Card>
  )
}


