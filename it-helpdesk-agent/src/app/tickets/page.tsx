"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, differenceInMinutes } from "date-fns";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TicketSummaryCards } from "@/components/ticket-summary-cards";
import { TicketsTable } from "@/components/tickets-table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Ticket } from "@/lib/ticket-types";
import { toast } from "sonner";
import { AdminTicketsDashboard } from "@/components/admin-tickets-dashboard";

// Status color mapping
const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
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
  new: "New",
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
  new: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

export default function TicketsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [counts, setCounts] = React.useState<TicketCounts>({
    total: 0,
    new: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(
    null
  );

  const fetchTickets = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const ticketsRes = await fetch("/api/tickets");
      const ticketsData = await ticketsRes.json();

      if (ticketsData.success) {
        setTickets(ticketsData.data);
      }

      const countsRes = await fetch("/api/tickets?counts_only=true");
      const countsData = await countsRes.json();

      if (countsData.success) {
        setCounts(countsData.data);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleRefresh = async () => {
    await fetchTickets();
    toast.success("Tickets refreshed");
  };

  const handleNewTicket = () => {
    toast.info("New ticket dialog - coming soon!");
  };

  const handleTicketClick = (ticket: Ticket) => {
    // Admin mode: navigate to full-screen chat view
    if (isAdmin) {
      router.push(`/tickets/${ticket.id}`);
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Admin Mode</span>
              <Switch
                id="admin-mode"
                checked={isAdmin}
                onCheckedChange={setIsAdmin}
              />
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
                new_count={counts.new}
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
                className="sm:max-w-2xl overflow-y-auto"
              >
                {selectedTicket && (
                  <>
                    <SheetHeader className="pb-4 border-b">
                      <div className="flex items-start justify-between gap-3 pr-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-xs font-mono"
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
                          <SheetTitle className="text-xl leading-tight pr-4">
                            {selectedTicket.title}
                          </SheetTitle>
                        </div>
                      </div>
                      {selectedTicket.description && (
                        <SheetDescription className="pt-2 text-sm leading-relaxed">
                          {selectedTicket.description}
                        </SheetDescription>
                      )}
                    </SheetHeader>

                    <div className="flex flex-col gap-6 py-6">
                      {/* Ticket Information Section */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Ticket Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Type
                              </p>
                              <p className="text-sm font-medium capitalize">
                                {selectedTicket.ticket_type.replace("_", " ")}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Priority
                              </p>
                              <p className="text-sm font-medium capitalize">
                                {selectedTicket.priority || "Not set"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Application / System
                              </p>
                              <p className="text-sm font-medium">
                                {selectedTicket.app_or_system ||
                                  "Not specified"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Team
                              </p>
                              <p className="text-sm font-medium">
                                {selectedTicket.suggested_team ||
                                  "Not assigned"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* People & Assignment Section */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            People & Assignment
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Requester
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">
                                {selectedTicket.user_name || "Unknown"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Timeline Section */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Timeline
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Created
                                </p>
                                <p className="text-sm font-medium">
                                  {format(
                                    new Date(selectedTicket.created_at),
                                    "MMM d, yyyy • h:mm a"
                                  )}
                                </p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Last Updated
                                </p>
                                <p className="text-sm font-medium">
                                  {format(
                                    new Date(selectedTicket.updated_at),
                                    "MMM d, yyyy • h:mm a"
                                  )}
                                </p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Time Open
                                </p>
                                <p className="text-sm font-medium">
                                  {formatDurationMinutes(
                                    selectedTicket.created_at
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Collected Details Section */}
                      {selectedTicket.collected_details &&
                        Object.keys(selectedTicket.collected_details).length >
                          0 && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Collected Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="rounded-lg bg-muted/50 p-4">
                                <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground">
                                  {JSON.stringify(
                                    selectedTicket.collected_details,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
