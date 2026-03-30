"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, differenceInMinutes } from "date-fns";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TicketSummaryCards } from "@/components/ticket-summary-cards";
import { TicketsTable } from "@/components/tickets-table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Building2,
  Users,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Ticket } from "@/lib/ticket-types";
import { toast } from "sonner";
import { AdminTicketsDashboard } from "@/components/admin-tickets-dashboard";
import { NewTicketSidebar } from "@/components/new-ticket-sidebar";
import { useAuth } from "@/lib/AuthProvider";
import { isDemoAccount } from "@/lib/demo-utils";
import { telemetryGeneratedTickets } from "@/lib/telemetry-data";

// Status color mapping
const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
  in_progress:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  resolved:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30",
  closed:
    "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-500/30",
};

// Status display labels
const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

// Priority color mapping
const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
};

// Ticket type color mapping
const ticketTypeColors: Record<string, string> = {
  incident:
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
  access_request:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
  request:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
};

// Ticket type display labels
const ticketTypeLabels: Record<string, string> = {
  incident: "Incident",
  access_request: "Access Request",
  request: "Request",
};

interface TicketCounts {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { email } = useAuth();
  const isDemo = isDemoAccount(email);
  const [isAdmin, setIsAdmin] = React.useState(searchParams.get("admin") === "true");
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [counts, setCounts] = React.useState<TicketCounts>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(
    null
  );
  const [isNewTicketOpen, setIsNewTicketOpen] = React.useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = React.useState(false);
  const [isSeedingData, setIsSeedingData] = React.useState(false);

  // Dummy tickets for demo
  const dummyTickets: Ticket[] = React.useMemo(() => [
    {
      id: "TKT-1024",
      lyzrUserId: "demo-user-001",
      ticket_type: "incident" as const,
      title: "VPN connection failing from laptop",
      description: "Unable to connect to corporate VPN since this morning. Error: Connection timed out.",
      user_name: "Demo User",
      app_or_system: "GlobalProtect VPN",
      priority: "high" as const,
      status: "open" as const,
      suggested_team: "Network" as const,
      collected_details: { os: "Windows 11", vpn_client: "GlobalProtect 6.1" },
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: "TKT-1023",
      lyzrUserId: "demo-user-001",
      ticket_type: "access_request" as const,
      title: "Request access to Salesforce CRM",
      description: "Need read/write access to Salesforce for the Q2 sales reporting project.",
      user_name: "Demo User",
      app_or_system: "Salesforce",
      priority: "medium" as const,
      status: "in_progress" as const,
      suggested_team: "IAM" as const,
      collected_details: { access_level: "read/write", justification: "Q2 sales reporting" },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    },
    {
      id: "TKT-1022",
      lyzrUserId: "demo-user-001",
      ticket_type: "incident" as const,
      title: "Outlook keeps crashing on startup",
      description: "Microsoft Outlook crashes immediately after opening. Tried restarting, issue persists.",
      user_name: "Demo User",
      app_or_system: "Microsoft Outlook",
      priority: "high" as const,
      status: "in_progress" as const,
      suggested_team: "Endpoint Support" as const,
      collected_details: { outlook_version: "365", last_update: "2 days ago" },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: "TKT-1021",
      lyzrUserId: "demo-user-001",
      ticket_type: "request" as const,
      title: "New monitor setup for workstation",
      description: "Requesting a second monitor for my desk in Building A, Floor 3.",
      user_name: "Demo User",
      app_or_system: "Hardware",
      priority: "low" as const,
      status: "open" as const,
      suggested_team: "Endpoint Support" as const,
      collected_details: { location: "Building A, Floor 3", monitor_type: "27-inch" },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: "TKT-1020",
      lyzrUserId: "demo-user-001",
      ticket_type: "incident" as const,
      title: "Cannot access shared drive \\\\fileserver\\marketing",
      description: "Getting 'Access Denied' error when trying to open the marketing shared drive.",
      user_name: "Demo User",
      app_or_system: "File Server",
      priority: "medium" as const,
      status: "resolved" as const,
      suggested_team: "Network" as const,
      collected_details: { error_message: "Access Denied", drive_path: "\\\\fileserver\\marketing" },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: "TKT-1019",
      lyzrUserId: "demo-user-001",
      ticket_type: "access_request" as const,
      title: "Admin access to AWS staging environment",
      description: "Need admin access to AWS staging for deploying the new microservice.",
      user_name: "Demo User",
      app_or_system: "AWS",
      priority: "high" as const,
      status: "resolved" as const,
      suggested_team: "DevOps" as const,
      collected_details: { aws_account: "staging", access_level: "admin" },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
      resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
    },
    {
      id: "TKT-1018",
      lyzrUserId: "demo-user-001",
      ticket_type: "incident" as const,
      title: "Laptop battery draining unusually fast",
      description: "Battery only lasting ~2 hours when it used to last 6+. MacBook Pro 2023.",
      user_name: "Demo User",
      app_or_system: "MacBook Pro",
      priority: "low" as const,
      status: "closed" as const,
      suggested_team: "Endpoint Support" as const,
      collected_details: { device: "MacBook Pro 2023", battery_health: "78%" },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 68).toISOString(),
      resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 68).toISOString(),
      csat_score: 1,
    },
    ...telemetryGeneratedTickets,
  ], []);

  const fetchTickets = React.useCallback(async () => {
    setIsLoading(true);
    // Use dummy data instead of API calls
    await new Promise((resolve) => setTimeout(resolve, 300));
    setTickets(dummyTickets);
    const open = dummyTickets.filter((t) => t.status === "open").length;
    const inProgress = dummyTickets.filter((t) => t.status === "in_progress").length;
    const resolved = dummyTickets.filter((t) => t.status === "resolved").length;
    const closed = dummyTickets.filter((t) => t.status === "closed").length;
    setCounts({ total: dummyTickets.length, open, in_progress: inProgress, resolved, closed });
    setIsLoading(false);
  }, [dummyTickets]);

  React.useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleRefresh = async () => {
    await fetchTickets();
    toast.success("Tickets refreshed");
  };

  const handleNewTicket = () => {
    setIsNewTicketOpen(true);
  };

  const handleTicketClick = (ticket: Ticket) => {
    // Admin mode: navigate to full-screen chat view
    if (isAdmin) {
      router.push(`/tickets/${ticket.id}?admin=true`);
    } else {
      // Non-admin: show read-only sidebar
      setSelectedTicket(ticket);
    }
  };

  const formatDurationMinutes = (createdAt: string, resolvedAt?: string) => {
    const start = new Date(createdAt);
    const end = resolvedAt ? new Date(resolvedAt) : new Date();
    const mins = differenceInMinutes(end, start);
    if (mins < 60) return `${mins} min`;
    const hours = Math.round(mins / 60);
    return `${hours} hr`;
  };

  const handleRatingSubmit = async (rating: 0 | 1) => {
    if (
      !selectedTicket ||
      (selectedTicket.status !== "resolved" &&
        selectedTicket.status !== "closed")
    ) {
      return;
    }

    setIsSubmittingRating(true);
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csat_score: rating,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      const data = await response.json();
      if (data.success) {
        setSelectedTicket(data.data);
        toast.success(
          rating === 1
            ? "Thank you for your positive feedback!"
            : "We appreciate your feedback and will work to improve."
        );
        // Refresh tickets list to update counts
        await fetchTickets();
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSeedDemoData = async () => {
    setIsSeedingData(true);
    try {
      const response = await fetch("/api/admin/seed-demo-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email || "",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to seed demo data");
      }

      toast.success(
        `Successfully created ${data.data?.count || 0} demo tickets! 🎉`
      );

      // Refresh tickets list
      await fetchTickets();
    } catch (error) {
      console.error("Error seeding demo data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to seed demo data"
      );
    } finally {
      setIsSeedingData(false);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen overflow-auto">
        <div className="flex flex-col gap-4 md:gap-6 py-4 md:py-6 px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Support Tickets
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and track your support requests
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isDemo && counts.total < 20 && (
                <Button
                  onClick={handleSeedDemoData}
                  disabled={isSeedingData}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {isSeedingData ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Seed Demo Data (14 tickets)
                    </>
                  )}
                </Button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Admin Mode</span>
                <Switch
                  id="admin-mode"
                  checked={isAdmin}
                  onCheckedChange={setIsAdmin}
                />
              </div>
            </div>
          </div>

          {isAdmin ? (
            <AdminTicketsDashboard
              tickets={tickets}
              onTicketsUpdated={setTickets}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              onTicketClick={(ticket) => router.push(`/tickets/${ticket.id}`)}
            />
          ) : (
            <>
              <TicketSummaryCards
                total={counts.total}
                open={counts.open}
                inProgress={counts.in_progress}
                resolved={counts.resolved}
              />

              <TicketsTable
                data={tickets}
                onRefresh={handleRefresh}
                onNewTicket={handleNewTicket}
                isLoading={isLoading}
                onRowClick={handleTicketClick}
              />
            </>
          )}

          {/* Read-only ticket detail sidebar for non-admin users */}
          {!isAdmin && (
            <Sheet
              open={!!selectedTicket}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedTicket(null);
                }
              }}
            >
              <SheetContent
                side="right"
                className="sm:max-w-md overflow-y-auto p-0"
              >
                {selectedTicket && (
                  <>
                    {/* Compact Header */}
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                      <div className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono px-1.5 py-0"
                              >
                                {selectedTicket.id}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={statusColors[selectedTicket.status]}
                              >
                                {statusLabels[selectedTicket.status]}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  ticketTypeColors[selectedTicket.ticket_type]
                                }
                              >
                                {ticketTypeLabels[selectedTicket.ticket_type]}
                              </Badge>
                              {selectedTicket.priority && (
                                <Badge
                                  variant="outline"
                                  className={
                                    priorityColors[selectedTicket.priority]
                                  }
                                >
                                  {selectedTicket.priority
                                    .charAt(0)
                                    .toUpperCase() +
                                    selectedTicket.priority.slice(1)}
                                </Badge>
                              )}
                            </div>
                            <h2 className="text-base font-semibold leading-tight">
                              {selectedTicket.title}
                            </h2>
                            {selectedTicket.description && (
                              <p className="text-xs text-muted-foreground leading-snug">
                                {selectedTicket.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-3">
                      <div className="space-y-4 rounded-2xl border bg-card/80 shadow-xs p-4">
                        {/* Ticket Information Section */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">
                              Ticket Information
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Type
                              </p>
                              <p className="font-medium capitalize">
                                {selectedTicket.ticket_type.replace("_", " ")}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Priority
                              </p>
                              <p className="font-medium capitalize">
                                {selectedTicket.priority || "Not set"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                App/System
                              </p>
                              <p className="font-medium">
                                {selectedTicket.app_or_system || (
                                  <span className="text-muted-foreground">
                                    Not specified
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Team
                              </p>
                              <p className="font-medium">
                                {selectedTicket.suggested_team}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* People & Assignment Section */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">People</h3>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center justify-between gap-4 py-1.5">
                              <span className="text-xs text-muted-foreground">
                                Requester
                              </span>
                              <span className="font-medium text-right">
                                {selectedTicket.user_name || "Unknown"}
                              </span>
                            </div>
                            {selectedTicket.assignee && (
                              <>
                                <Separator />
                                <div className="flex items-center justify-between gap-4 py-1.5">
                                  <span className="text-xs text-muted-foreground">
                                    Assignee
                                  </span>
                                  <span className="font-medium text-right">
                                    {selectedTicket.assignee}
                                  </span>
                                </div>
                              </>
                            )}
                            {selectedTicket.source && (
                              <>
                                <Separator />
                                <div className="flex items-center justify-between gap-4 py-1.5">
                                  <span className="text-xs text-muted-foreground">
                                    Source
                                  </span>
                                  <span className="font-medium capitalize text-right">
                                    {selectedTicket.source}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <Separator />

                        {/* Timeline Section */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">Timeline</h3>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-4 py-1.5">
                              <span className="text-muted-foreground">
                                Created
                              </span>
                              <span className="font-medium text-right">
                                {format(
                                  new Date(selectedTicket.created_at),
                                  "MMM d, h:mm a"
                                )}
                              </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between gap-4 py-1.5">
                              <span className="text-muted-foreground">
                                Updated
                              </span>
                              <span className="font-medium text-right">
                                {format(
                                  new Date(selectedTicket.updated_at),
                                  "MMM d, h:mm a"
                                )}
                              </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between gap-4 py-1.5">
                              <span className="text-muted-foreground">
                                Time Open
                              </span>
                              <span className="font-medium text-right">
                                {formatDurationMinutes(
                                  selectedTicket.created_at,
                                  selectedTicket.resolved_at
                                )}
                              </span>
                            </div>
                            {selectedTicket.resolved_at && (
                              <>
                                <Separator />
                                <div className="flex items-center justify-between gap-4 py-1.5">
                                  <span className="text-muted-foreground">
                                    Resolved
                                  </span>
                                  <span className="font-medium text-right text-green-600 dark:text-green-400">
                                    {format(
                                      new Date(selectedTicket.resolved_at),
                                      "MMM d, h:mm a"
                                    )}
                                  </span>
                                </div>
                              </>
                            )}
                            {selectedTicket.sla_due_at && (
                              <>
                                <Separator />
                                <div className="flex items-center justify-between gap-4 py-1.5">
                                  <span className="text-muted-foreground">
                                    SLA Due
                                  </span>
                                  <span className="font-medium text-right">
                                    {format(
                                      new Date(selectedTicket.sla_due_at),
                                      "MMM d, h:mm a"
                                    )}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* External IDs Section */}
                        {selectedTicket.external_ids &&
                          Object.keys(selectedTicket.external_ids).length >
                            0 && (
                            <>
                              <Separator />
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                  <h3 className="text-sm font-semibold">
                                    External IDs
                                  </h3>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(
                                    selectedTicket.external_ids
                                  ).map(([key, value]) => (
                                    <Badge
                                      key={key}
                                      variant="outline"
                                      className="text-[11px] font-mono px-2 py-0.5"
                                    >
                                      {key}: {value}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                        {/* Collected Details Section */}
                        {selectedTicket.collected_details &&
                          Object.keys(selectedTicket.collected_details).length >
                            0 && (
                            <>
                              <Separator />
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                  <h3 className="text-sm font-semibold">
                                    Additional Details
                                  </h3>
                                </div>
                                <div className="rounded-md bg-muted/50 border p-3">
                                  <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono">
                                    {JSON.stringify(
                                      selectedTicket.collected_details,
                                      null,
                                      2
                                    )}
                                  </pre>
                                </div>
                              </div>
                            </>
                          )}

                        {/* CSAT Rating Section - Only show for resolved/closed tickets */}
                        {(selectedTicket.status === "resolved" ||
                          selectedTicket.status === "closed") && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold">
                                Rate Your Experience
                              </h3>
                              {selectedTicket.csat_score !== undefined ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    {selectedTicket.csat_score === 1 ? (
                                      <>
                                        <ThumbsUp className="h-4 w-4 text-green-600" />
                                        <span className="text-muted-foreground">
                                          You rated this ticket positively
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <ThumbsDown className="h-4 w-4 text-red-600" />
                                        <span className="text-muted-foreground">
                                          You rated this ticket negatively
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {selectedTicket.csat_submitted_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Rated on{" "}
                                      {format(
                                        new Date(
                                          selectedTicket.csat_submitted_at
                                        ),
                                        "MMM d, h:mm a"
                                      )}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    How satisfied were you with the resolution?
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleRatingSubmit(1)}
                                      disabled={isSubmittingRating}
                                      className="h-9 w-9"
                                      title="Thumbs Up"
                                    >
                                      <ThumbsUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleRatingSubmit(0)}
                                      disabled={isSubmittingRating}
                                      className="h-9 w-9"
                                      title="Thumbs Down"
                                    >
                                      <ThumbsDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>
          )}

          {/* New Ticket Sidebar */}
          <NewTicketSidebar
            open={isNewTicketOpen}
            onOpenChange={setIsNewTicketOpen}
            onTicketCreated={handleRefresh}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
