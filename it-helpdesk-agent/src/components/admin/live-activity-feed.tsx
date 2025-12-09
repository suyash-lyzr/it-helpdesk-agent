"use client";

import * as React from "react";
import { format, formatDistanceToNow, subHours, subDays } from "date-fns";
import {
  Activity,
  Circle,
  Ticket,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Clock,
  RefreshCw,
  Search,
  Settings,
  Eye,
  Bell,
  ArrowUpRight,
  Sparkles,
  Zap,
  Shield,
  UserCheck,
  Send,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LiveEvent, addLiveEvent } from "@/lib/analytics-store";
import { toast } from "sonner";
import { Ticket as TicketType } from "@/lib/ticket-types";

interface LiveActivityFeedProps {
  events: LiveEvent[];
  onReplay?: (eventType: string) => void;
  lastUpdated?: Date;
  onViewTicket?: (ticketId: string) => void;
  onViewAccessRequest?: (requestId: string) => void;
  onRefresh?: () => void;
}

type EventCategory =
  | "all"
  | "tickets"
  | "access"
  | "sla"
  | "automations"
  | "integrations"
  | "ai_insights";

type TimeRange = "1h" | "6h" | "24h" | "7d";

const eventIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  ticket_created: Ticket,
  ticket_updated: Activity,
  ticket_assigned: Activity,
  ticket_resolved: CheckCircle2,
  sla_breached: AlertTriangle,
  sla_warning: Clock,
  external_id_created: ExternalLink,
  approval_pending: Clock,
  access_request_submitted: UserCheck,
  access_request_approved: CheckCircle2,
  access_request_reminder: Bell,
  automation_fired: Zap,
  integration_event: ExternalLink,
  ai_insight: Sparkles,
  ai_anomaly: AlertTriangle,
};

const eventColors: Record<string, string> = {
  ticket_created: "bg-blue-500",
  ticket_updated: "bg-blue-400",
  ticket_assigned: "bg-blue-400",
  ticket_resolved: "bg-green-500",
  sla_breached: "bg-red-500",
  sla_warning: "bg-orange-500",
  external_id_created: "bg-green-600",
  approval_pending: "bg-yellow-500",
  access_request_submitted: "bg-purple-500",
  access_request_approved: "bg-purple-400",
  access_request_reminder: "bg-purple-300",
  automation_fired: "bg-yellow-500",
  integration_event: "bg-teal-500",
  ai_insight: "bg-pink-500",
  ai_anomaly: "bg-pink-600",
};

const categoryLabels: Record<EventCategory, string> = {
  all: "All",
  tickets: "Tickets",
  access: "Access",
  sla: "SLA",
  automations: "Automations",
  integrations: "Integrations",
  ai_insights: "AI Insights",
};

export function LiveActivityFeed({
  events,
  onReplay,
  lastUpdated,
  onViewTicket,
  onViewAccessRequest,
  onRefresh,
}: LiveActivityFeedProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState<EventCategory>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [timeRange, setTimeRange] = React.useState<TimeRange>("24h");
  const [showCriticalOnly, setShowCriticalOnly] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<LiveEvent | null>(
    null
  );
  const [viewTicketModal, setViewTicketModal] = React.useState(false);
  const [viewARModal, setViewARModal] = React.useState(false);

  // Filter events
  const filteredEvents = React.useMemo(() => {
    let filtered = [...events];

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (e) =>
          e.category === selectedCategory || e.category === selectedCategory
      );
    }

    // Time range filter
    const now = new Date();
    const cutoff =
      timeRange === "1h"
        ? subHours(now, 1)
        : timeRange === "6h"
        ? subHours(now, 6)
        : timeRange === "24h"
        ? subHours(now, 24)
        : subDays(now, 7);
    filtered = filtered.filter((e) => new Date(e.timestamp) >= cutoff);

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.ticketId?.toLowerCase().includes(query) ||
          e.requestId?.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.headline?.toLowerCase().includes(query) ||
          e.actor?.toLowerCase().includes(query) ||
          e.externalId?.toLowerCase().includes(query)
      );
    }

    // Critical only filter
    if (showCriticalOnly) {
      filtered = filtered.filter(
        (e) => e.severity === "critical" || e.severity === "high"
      );
    }

    return filtered;
  }, [events, selectedCategory, searchQuery, timeRange, showCriticalOnly]);

  const handleCreateIncident = (event: LiveEvent) => {
    const incidentId = `INC-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;
    addLiveEvent({
      type: "external_id_created",
      actor: "System",
      description: `Incident created: ${incidentId} (demo)`,
      headline: `Incident created: ${incidentId} (demo)`,
      details: `Created from event: ${event.headline || event.description}`,
      ticketId: event.ticketId,
      category: "tickets",
      severity: "high",
      externalId: incidentId,
    });
    toast.success(`Incident created: ${incidentId} (demo)`);
    onRefresh?.();
  };

  const handleRemind = (event: LiveEvent) => {
    if (event.requestId) {
      addLiveEvent({
        type: "access_request_reminder",
        requestId: event.requestId,
        actor: "System",
        description: `Reminder sent to approver for ${event.requestId} (demo)`,
        headline: `Reminder sent to approver`,
        details: `Access request ${event.requestId} pending for 24+ hours`,
        category: "access",
        severity: "low",
      });
      toast.success(`Reminder sent (demo)`);
      onRefresh?.();
    }
  };

  const handleEscalate = (event: LiveEvent) => {
    const ticketId = `TKT-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;
    addLiveEvent({
      type: "ticket_created",
      ticketId,
      actor: "System",
      description: `Escalated to IAM team — Ticket ${ticketId} created (demo)`,
      headline: `Escalated to IAM team — Ticket ${ticketId} created (demo)`,
      details: `Escalation for ${event.requestId || event.ticketId}`,
      category: event.category || "tickets",
      severity: "high",
    });
    toast.success(`Escalated — Ticket ${ticketId} created (demo)`);
    onRefresh?.();
  };

  const handleViewTicket = (event: LiveEvent) => {
    if (event.ticketId) {
      setSelectedEvent(event);
      setViewTicketModal(true);
      onViewTicket?.(event.ticketId);
    }
  };

  const handleViewAR = (event: LiveEvent) => {
    if (event.requestId) {
      setSelectedEvent(event);
      setViewARModal(true);
      onViewAccessRequest?.(event.requestId);
    }
  };

  const getEventIcon = (event: LiveEvent) => {
    const Icon = eventIcons[event.type] || Activity;
    return Icon;
  };

  const getEventColor = (event: LiveEvent) => {
    return eventColors[event.type] || "bg-gray-500";
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Live Activity Feed
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Circle className="h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Live operational events from the helpdesk and
                      integrations.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription className="mt-1">
                Real-time updates and webhook events
                {lastUpdated && (
                  <span className="ml-2">
                    • Updated {format(lastUpdated, "HH:mm:ss")}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onRefresh}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {(Object.keys(categoryLabels) as EventCategory[]).map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {categoryLabels[cat]}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by ticket ID, user, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-8 text-xs"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select
                value={timeRange}
                onValueChange={(v) => setTimeRange(v as TimeRange)}
              >
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last 1h</SelectItem>
                  <SelectItem value="6h">Last 6h</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7d</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showCriticalOnly ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowCriticalOnly(!showCriticalOnly)}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Critical Only
              </Button>
            </div>
          </div>

          {/* Event Feed */}
          <ScrollArea className="h-[400px] w-full">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No events found
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery || selectedCategory !== "all" || showCriticalOnly
                    ? "Try adjusting your filters to see more events."
                    : "Activity feed will show ticket updates, SLA warnings, and integration events."}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {filteredEvents.map((event) => {
                  const Icon = getEventIcon(event);
                  const color = getEventColor(event);
                  const timeAgo = formatDistanceToNow(
                    new Date(event.timestamp),
                    {
                      addSuffix: true,
                    }
                  );

                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent transition-colors"
                      role="article"
                      aria-label={`${
                        event.headline || event.description
                      } - ${timeAgo}`}
                    >
                      {/* Color dot / Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div
                          className={`h-2 w-2 rounded-full ${color}`}
                          aria-hidden="true"
                        />
                      </div>

                      {/* Event Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight">
                              {event.headline || event.description}
                            </p>
                            {event.details && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {event.details}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {timeAgo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {event.ticketId && (
                            <span className="font-mono">{event.ticketId}</span>
                          )}
                          {event.requestId && (
                            <span className="font-mono">{event.requestId}</span>
                          )}
                          {event.actor && <span>by {event.actor}</span>}
                          {event.externalId && (
                            <Badge variant="outline" className="text-[10px]">
                              {event.externalId}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {event.requestId ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleViewAR(event)}
                                aria-label={`View access request ${event.requestId}`}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">View Access Request</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : event.ticketId ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleViewTicket(event)}
                                aria-label={`View ticket ${event.ticketId}`}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">View Ticket</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                        {(event.type === "ai_anomaly" ||
                          event.severity === "critical" ||
                          event.severity === "high") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleCreateIncident(event)}
                                aria-label="Create incident"
                              >
                                <AlertTriangle className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Create Incident</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {(event.type === "access_request_submitted" ||
                          event.type === "approval_pending") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleRemind(event)}
                                aria-label="Send reminder"
                              >
                                <Bell className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Remind</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {(event.type === "access_request_submitted" ||
                          event.type === "access_request_reminder") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleEscalate(event)}
                                aria-label="Escalate"
                              >
                                <ArrowUpRight className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Escalate</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Showing {filteredEvents.length} events</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">Legend:</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px]">Tickets</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span className="text-[10px]">Access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px]">SLA</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  <span className="text-[10px]">Automations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  <span className="text-[10px]">Integrations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                  <span className="text-[10px]">AI</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Ticket Modal */}
      <Dialog open={viewTicketModal} onOpenChange={setViewTicketModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.ticketId || "Ticket Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.headline || selectedEvent?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {selectedEvent?.details && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Details</p>
                <p>{selectedEvent.details}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {selectedEvent?.actor && (
                <div>
                  <p className="text-xs text-muted-foreground">Actor</p>
                  <p className="font-medium">{selectedEvent.actor}</p>
                </div>
              )}
              {selectedEvent?.timestamp && (
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedEvent.timestamp),
                      "MMM d, yyyy • HH:mm:ss"
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (selectedEvent?.ticketId) {
                    handleCreateIncident(selectedEvent);
                  }
                }}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Create Incident
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Access Request Modal */}
      <Dialog open={viewARModal} onOpenChange={setViewARModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.requestId || "Access Request Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.headline || selectedEvent?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {selectedEvent?.details && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Details</p>
                <p>{selectedEvent.details}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {selectedEvent?.actor && (
                <div>
                  <p className="text-xs text-muted-foreground">Actor</p>
                  <p className="font-medium">{selectedEvent.actor}</p>
                </div>
              )}
              {selectedEvent?.timestamp && (
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedEvent.timestamp),
                      "MMM d, yyyy • HH:mm:ss"
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (selectedEvent) {
                    handleRemind(selectedEvent);
                  }
                }}
              >
                <Bell className="h-3 w-3 mr-1" />
                Send Reminder
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (selectedEvent) {
                    handleEscalate(selectedEvent);
                  }
                }}
              >
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Escalate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
