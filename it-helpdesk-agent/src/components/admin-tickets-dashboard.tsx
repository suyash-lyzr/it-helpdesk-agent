"use client";

import * as React from "react";
import { format, subDays, differenceInMinutes } from "date-fns";
import { Ticket } from "@/lib/ticket-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { TicketsTable } from "@/components/tickets-table";
import { toast } from "sonner";
import {
  AnalyticsFilters,
  FilterState,
} from "@/components/admin/analytics-filters";
import { KPICards } from "@/components/admin/kpi-cards";
import { SLAFunnel } from "@/components/admin/sla-funnel";
import { TopIssuesTable } from "@/components/admin/top-issues-table";
import { TeamPerformanceComponent } from "@/components/admin/team-performance";
import { LifecycleFunnel } from "@/components/admin/lifecycle-funnel";
import { LiveActivityFeed } from "@/components/admin/live-activity-feed";
import { ForecastChart } from "@/components/admin/forecast-chart";
import { AccessRequestAnalyticsComponent } from "@/components/admin/access-request-analytics";
import { ReportBuilder } from "@/components/admin/report-builder";
import { AlertRules } from "@/components/admin/alert-rules";
import { AssetWidget } from "@/components/admin/asset-widget";
import { SLABreachDiagnostics } from "@/components/admin/sla-breach-diagnostics";
import { getAssetById } from "@/lib/mock-assets";
import {
  KPIMetrics,
  SLAFunnelData,
  TopIssue,
  TeamPerformance,
  LifecycleStageData,
  LiveEvent,
  ForecastData,
  addLiveEvent,
  AccessRequestAnalytics,
} from "@/lib/analytics-store";

interface AdminTicketsDashboardProps {
  tickets: Ticket[];
  onTicketsUpdated: (tickets: Ticket[]) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  onTicketClick?: (ticket: Ticket) => void;
}

export function AdminTicketsDashboard({
  tickets,
  onTicketsUpdated,
  onRefresh,
  isLoading,
  onTicketClick,
}: AdminTicketsDashboardProps) {
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(
    null
  );
  const [isResolving, setIsResolving] = React.useState(false);
  const [resolutionText, setResolutionText] = React.useState("");
  const [filters, setFilters] = React.useState<FilterState>({});
  const [kpiMetrics, setKpiMetrics] = React.useState<KPIMetrics | null>(null);
  const [slaFunnel, setSlaFunnel] = React.useState<SLAFunnelData[]>([]);
  const [topIssues, setTopIssues] = React.useState<TopIssue[]>([]);
  const [teamPerformance, setTeamPerformance] = React.useState<
    TeamPerformance[]
  >([]);
  const [lifecycleData, setLifecycleData] = React.useState<
    LifecycleStageData[]
  >([]);
  const [forecastData, setForecastData] = React.useState<ForecastData[]>([]);
  const [liveEvents, setLiveEvents] = React.useState<LiveEvent[]>([]);
  const [accessRequestAnalytics, setAccessRequestAnalytics] =
    React.useState<AccessRequestAnalytics | null>(null);
  const [scheduledReports, setScheduledReports] = React.useState<
    Array<{
      id: string;
      name: string;
      frequency: "daily" | "weekly" | "monthly" | "none";
      recipients: string[];
      createdAt: string;
      lastRun?: string;
      metrics: string[];
      format: "csv" | "pdf";
    }>
  >([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = React.useState(true);

  // Fetch analytics data
  const fetchAnalytics = React.useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
      const startDate =
        filters.startDate || format(subDays(new Date(), 7), "yyyy-MM-dd");
      const endDate = filters.endDate || format(new Date(), "yyyy-MM-dd");

      const [
        kpisRes,
        slaRes,
        topIssuesRes,
        teamRes,
        lifecycleRes,
        forecastRes,
        accessRes,
        eventsRes,
      ] = await Promise.all([
        fetch(
          `/api/analytics/kpis?start_date=${startDate}&end_date=${endDate}`
        ),
        fetch("/api/analytics/sla-funnel"),
        fetch("/api/analytics/top-issues?limit=10"),
        fetch("/api/analytics/team-performance"),
        fetch("/api/analytics/lifecycle"),
        fetch("/api/analytics/forecast?days=7"),
        fetch("/api/analytics/access-requests"),
        fetch("/api/analytics/live-events"),
      ]);

      if (kpisRes.ok) {
        const kpis = await kpisRes.json();
        setKpiMetrics(kpis.data);
      }
      if (slaRes.ok) {
        const sla = await slaRes.json();
        setSlaFunnel(sla.data);
      }
      if (topIssuesRes.ok) {
        const issues = await topIssuesRes.json();
        setTopIssues(issues.data);
      }
      if (teamRes.ok) {
        const team = await teamRes.json();
        setTeamPerformance(team.data);
      }
      if (lifecycleRes.ok) {
        const lifecycle = await lifecycleRes.json();
        setLifecycleData(lifecycle.data);
      }
      if (forecastRes.ok) {
        const forecast = await forecastRes.json();
        setForecastData(forecast.data);
      }
      if (accessRes.ok) {
        const access = await accessRes.json();
        setAccessRequestAnalytics(access.data);
      }
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        setLiveEvents(events.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [filters]);

  React.useEffect(() => {
    // Reset loading state when component mounts or filters change
    setIsLoadingAnalytics(true);
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  async function handleResolveTicket() {
    if (!selectedTicket) return;
    if (!resolutionText.trim()) {
      toast.info("Please add a resolution note before resolving the ticket");
      return;
    }
    if (
      selectedTicket.status === "resolved" ||
      selectedTicket.status === "closed"
    ) {
      toast.info("Ticket is already resolved");
      return;
    }

    try {
      setIsResolving(true);
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          collected_details: {
            ...(selectedTicket.collected_details ?? {}),
            resolution: resolutionText.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const fallbackUpdated: Ticket = {
          ...selectedTicket,
          status: "resolved",
          resolved_at: new Date().toISOString(),
          collected_details: {
            ...(selectedTicket.collected_details ?? {}),
            resolution: resolutionText.trim(),
          },
          updated_at: new Date().toISOString(),
        };
        const fallbackTickets = tickets.map((t) =>
          t.id === fallbackUpdated.id ? fallbackUpdated : t
        );
        onTicketsUpdated(fallbackTickets);
        setSelectedTicket(fallbackUpdated);
        setResolutionText("");
        return;
      }

      const updated = data.data as Ticket;
      const newTickets = tickets.map((t) =>
        t.id === updated.id ? updated : t
      );
      onTicketsUpdated(newTickets);
      setSelectedTicket(updated);
      setResolutionText("");

      // Add live event
      addLiveEvent({
        type: "ticket_updated",
        ticketId: updated.id,
        actor: "Admin",
        description: `Ticket ${updated.id} resolved`,
      });
      setLiveEvents((prev) => [
        {
          id: `event-${Date.now()}`,
          type: "ticket_updated",
          timestamp: new Date().toISOString(),
          ticketId: updated.id,
          actor: "Admin",
          description: `Ticket ${updated.id} resolved`,
        },
        ...prev,
      ]);

      // Refresh analytics to update KPIs, counts, etc.
      await fetchAnalytics();

      // Trigger parent refresh to update ticket counts
      onRefresh?.();

      toast.success(`Ticket ${updated.id} marked as resolved`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to resolve ticket");
    } finally {
      setIsResolving(false);
    }
  }

  function formatDurationMinutes(createdAt: string, resolvedAt?: string) {
    const start = new Date(createdAt);
    const end = resolvedAt ? new Date(resolvedAt) : new Date();
    const mins = differenceInMinutes(end, start);
    if (mins < 60) return `${mins} min`;
    const hours = Math.round(mins / 60);
    return `${hours} hr`;
  }

  const handleKpiClick = (filter: string) => {
    // Filter tickets based on KPI click
    toast.info(`Filtering by: ${filter}`);
  };

  const handleWebhookReplay = async (eventType: string) => {
    try {
      const response = await fetch("/api/webhook/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType }),
      });

      if (response.ok) {
        const data = await response.json();
        addLiveEvent({
          type: "external_id_created",
          ticketId: data.ticketId,
          actor: "System",
          description: data.message,
          externalId: data.externalId,
        });
        setLiveEvents((prev) => [
          {
            id: `event-${Date.now()}`,
            type: "external_id_created",
            timestamp: new Date().toISOString(),
            ticketId: data.ticketId,
            actor: "System",
            description: data.message,
            externalId: data.externalId,
          },
          ...prev,
        ]);
        toast.success("Webhook replayed successfully");
        onRefresh?.();
      }
    } catch (error) {
      console.error("Error replaying webhook:", error);
      toast.error("Failed to replay webhook");
    }
  };

  const handleReportGenerate = async (config: {
    name?: string;
    metrics: string[];
    format: "csv" | "pdf";
    dateRange?: { start: string; end: string };
    schedule?: {
      frequency: "daily" | "weekly" | "monthly";
      recipients: string[];
    };
  }) => {
    try {
      const response = await fetch("/api/analytics/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        if (config.format === "csv") {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `report-${Date.now()}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
        if (config.schedule) {
          // Refresh scheduled reports
          const scheduledRes = await fetch("/api/analytics/reports");
          if (scheduledRes.ok) {
            const scheduled = await scheduledRes.json();
            setScheduledReports(scheduled.data || []);
          }
        }
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    }
  };

  const filteredTickets = React.useMemo(() => {
    return tickets.filter((t) => {
      if (
        filters.team &&
        filters.team !== "all" &&
        t.suggested_team !== filters.team
      )
        return false;
      if (
        filters.priority &&
        filters.priority !== "all" &&
        t.priority !== filters.priority
      )
        return false;
      if (
        filters.category &&
        filters.category !== "all" &&
        t.ticket_type !== filters.category
      )
        return false;
      if (
        filters.source &&
        filters.source !== "all" &&
        t.source !== filters.source
      )
        return false;
      if (filters.startDate) {
        const created = new Date(t.created_at);
        const start = new Date(filters.startDate);
        if (created < start) return false;
      }
      if (filters.endDate) {
        const created = new Date(t.created_at);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
      return true;
    });
  }, [tickets, filters]);

  const selectedTicketAsset = React.useMemo(() => {
    if (!selectedTicket?.asset_id) return null;
    return getAssetById(selectedTicket.asset_id);
  }, [selectedTicket]);

  const isSLABreached = selectedTicket
    ? selectedTicket.sla_due_at &&
      new Date() > new Date(selectedTicket.sla_due_at) &&
      selectedTicket.status !== "resolved" &&
      selectedTicket.status !== "closed"
    : false;

  // Show loading state while analytics are being fetched
  if (isLoadingAnalytics) {
    return (
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Loading admin dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-3 py-3 md:gap-4 md:py-4">
        {/* Filters - Top Right */}
        <div className="flex justify-end px-6 lg:px-8">
          <AnalyticsFilters onFiltersChange={setFilters} />
        </div>

        {/* Executive Summary KPIs */}
        {kpiMetrics && (
          <KPICards metrics={kpiMetrics} onKpiClick={handleKpiClick} />
        )}

        {/* SLA Funnel & Lifecycle Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 px-6 lg:px-8">
          {slaFunnel.length > 0 && (
            <SLAFunnel
              data={slaFunnel}
              onSegmentClick={(priority, breachedTickets) => {
                toast.info(
                  `${breachedTickets.length} breached tickets for ${priority}`
                );
              }}
            />
          )}
          {lifecycleData.length > 0 && (
            <LifecycleFunnel
              data={lifecycleData}
              onStageClick={(stage, stageTickets) => {
                toast.info(`${stageTickets.length} tickets in ${stage} stage`);
              }}
            />
          )}
        </div>

        {/* Top Issues */}
        {topIssues.length > 0 && (
          <div className="px-6 lg:px-8">
            <TopIssuesTable
              issues={topIssues}
              onTicketClick={(ticketId) => {
                const ticket = tickets.find((t) => t.id === ticketId);
                if (ticket) {
                  if (onTicketClick) {
                    onTicketClick(ticket);
                  } else {
                    setSelectedTicket(ticket);
                  }
                }
              }}
              onOpenRelated={(issue) => {
                toast.info(`Opening related tickets for: ${issue.issue}`);
              }}
              onCreateExternal={(issue) => {
                toast.info(`Creating external incident for: ${issue.issue}`);
              }}
            />
          </div>
        )}

        {/* Team Performance */}
        {teamPerformance.length > 0 && (
          <div className="px-6 lg:px-8">
            <TeamPerformanceComponent
              data={teamPerformance}
              tickets={tickets}
              filters={filters}
            />
          </div>
        )}

        {/* Forecast & Access Request Analytics - Full Width Stacked */}
        <div className="space-y-3 md:space-y-4 px-6 lg:px-8">
          {forecastData.length > 0 && (
            <ForecastChart
              data={forecastData}
              onAnomalyAction={(anomaly, action) => {
                if (action === "create_incident") {
                  // Already handled in ForecastChart component with toast
                  // Add event to live feed
                  const newEvent = addLiveEvent({
                    type: "external_id_created",
                    description: `Incident created for anomaly: ${
                      anomaly.anomalyHeadline || anomaly.anomalyReason
                    }`,
                    actor: "system",
                  });
                  // Update local state
                  setLiveEvents((prev) => [newEvent, ...prev].slice(0, 50));
                }
              }}
              onNotifyTeam={(team) => {
                // Add event to live feed
                const newEvent = addLiveEvent({
                  type: "ticket_updated",
                  description: `Notification sent to ${team} team`,
                  actor: "system",
                });
                // Update local state
                setLiveEvents((prev) => [newEvent, ...prev].slice(0, 50));
              }}
            />
          )}
          {accessRequestAnalytics && (
            <AccessRequestAnalyticsComponent
              data={accessRequestAnalytics}
              onSendReminder={(approver, requestId) => {
                // Handled in component
              }}
              onEscalate={(requestId) => {
                // Handled in component
              }}
              onAutoApprove={(requestId) => {
                // Handled in component
              }}
              onBulkAction={(action, requestIds) => {
                // Handled in component
              }}
              onExportCSV={(filteredData) => {
                // Handled in component
              }}
            />
          )}
        </div>

        {/* Live Activity Feed - Full Width */}
        <div className="px-6 lg:px-8">
          <LiveActivityFeed
            events={liveEvents}
            onReplay={handleWebhookReplay}
            lastUpdated={new Date()}
            onViewTicket={(ticketId) => {
              const ticket = tickets.find((t) => t.id === ticketId);
              if (ticket) {
                if (onTicketClick) {
                  onTicketClick(ticket);
                } else {
                  setSelectedTicket(ticket);
                }
              }
            }}
            onViewAccessRequest={(requestId) => {
              toast.info(`Viewing access request ${requestId} (demo)`);
            }}
            onRefresh={() => {
              fetch("/api/analytics/live-events")
                .then((res) => res.json())
                .then((data) => setLiveEvents(data.data || []))
                .catch(console.error);
            }}
          />
        </div>

        {/* Reports & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 px-6 lg:px-8">
          <ReportBuilder
            onGenerateReport={handleReportGenerate}
            scheduledReports={scheduledReports}
            onReportsUpdated={() => {
              // Refresh reports if needed
              fetch("/api/analytics/reports/scheduled")
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    setScheduledReports(data.data || []);
                  }
                })
                .catch(console.error);
            }}
          />
          <AlertRules />
        </div>

        {/* All Tickets Table */}
        <div className="px-6 lg:px-8">
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">All Tickets</h2>
                  <p className="text-sm text-muted-foreground">
                    Full visibility into every ticket across the helpdesk
                  </p>
                </div>
                {onRefresh && (
                  <Button variant="outline" size="sm" onClick={onRefresh}>
                    Refresh
                  </Button>
                )}
              </div>
            </div>
            <div className="p-4">
              <TicketsTable
                data={filteredTickets}
                isLoading={isLoading}
                onRowClick={onTicketClick || setSelectedTicket}
              />
            </div>
          </div>
        </div>

        {/* Ticket Detail Sidebar */}
        <Sheet
          open={!!selectedTicket}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTicket(null);
              setResolutionText("");
            }
          }}
        >
          <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
            {selectedTicket && (
              <>
                <SheetHeader>
                  <div className="flex items-start justify-between gap-2 pr-8">
                    <SheetTitle className="flex-1">
                      {selectedTicket.title}
                    </SheetTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedTicket.id}
                    </Badge>
                  </div>
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
                      <p className="font-medium">
                        {selectedTicket.suggested_team}
                      </p>
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
                    {selectedTicket.assignee && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Assignee
                        </p>
                        <p className="font-medium">{selectedTicket.assignee}</p>
                      </div>
                    )}
                    {selectedTicket.source && (
                      <div>
                        <p className="text-xs text-muted-foreground">Source</p>
                        <p className="font-medium capitalize">
                          {selectedTicket.source}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {format(
                          new Date(selectedTicket.created_at),
                          "MMM d, yyyy • HH:mm"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Last Updated
                      </p>
                      <p className="font-medium">
                        {format(
                          new Date(selectedTicket.updated_at),
                          "MMM d, yyyy • HH:mm"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time Open</p>
                      <p className="font-medium">
                        {formatDurationMinutes(
                          selectedTicket.created_at,
                          selectedTicket.resolved_at
                        )}
                      </p>
                    </div>
                    {selectedTicket.sla_due_at && (
                      <div>
                        <p className="text-xs text-muted-foreground">SLA Due</p>
                        <p className="font-medium">
                          {format(
                            new Date(selectedTicket.sla_due_at),
                            "MMM d, yyyy • HH:mm"
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedTicket.external_ids &&
                    Object.keys(selectedTicket.external_ids).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          External IDs
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedTicket.external_ids).map(
                            ([key, value]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-xs"
                              >
                                {key}: {value}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {isSLABreached && (
                    <SLABreachDiagnostics ticket={selectedTicket} />
                  )}

                  {selectedTicketAsset && (
                    <AssetWidget
                      asset={selectedTicketAsset}
                      tickets={tickets}
                      onMarkReplacement={(assetId) => {
                        toast.info(`Marking asset ${assetId} for replacement`);
                      }}
                      onOpenCMDB={(assetId) => {
                        toast.info(`Opening CMDB record for ${assetId}`);
                      }}
                      onCreateReplacementTicket={(assetId) => {
                        toast.info(
                          `Creating replacement ticket for asset ${assetId}`
                        );
                      }}
                    />
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Collected Details
                    </p>
                    <pre className="rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                      {JSON.stringify(
                        selectedTicket.collected_details ?? {},
                        null,
                        2
                      )}
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
                      This note will be saved with the ticket under collected
                      details.
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
    </div>
  );
}
