"use client"

import * as React from "react"
import { format, differenceInMinutes } from "date-fns"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TicketSummaryCards } from "@/components/ticket-summary-cards"
import { TicketsTable } from "@/components/tickets-table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Ticket } from "@/lib/ticket-types"
import { toast } from "sonner"
import { AdminTicketsDashboard } from "@/components/admin-tickets-dashboard"

interface TicketCounts {
  total: number
  new: number
  open: number
  in_progress: number
  resolved: number
  closed: number
}

export default function TicketsPage() {
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [counts, setCounts] = React.useState<TicketCounts>({
    total: 0,
    new: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null)

  const fetchTickets = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const ticketsRes = await fetch("/api/tickets")
      const ticketsData = await ticketsRes.json()

      if (ticketsData.success) {
        setTickets(ticketsData.data)
      }

      const countsRes = await fetch("/api/tickets?counts_only=true")
      const countsData = await countsRes.json()

      if (countsData.success) {
        setCounts(countsData.data)
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast.error("Failed to load tickets")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleRefresh = async () => {
    await fetchTickets()
    toast.success("Tickets refreshed")
  }

  const handleNewTicket = () => {
    toast.info("New ticket dialog - coming soon!")
  }

  const formatDurationMinutes = (createdAt: string, resolvedAt?: string) => {
    const start = new Date(createdAt)
    const end = resolvedAt ? new Date(resolvedAt) : new Date()
    const mins = differenceInMinutes(end, start)
    if (mins < 60) return `${mins} min`
    const hours = Math.round(mins / 60)
    return `${hours} hr`
  }

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
              <h1 className="text-2xl font-semibold tracking-tight">Support Tickets</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage and track your support requests</p>
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
                onRowClick={setSelectedTicket}
              />
            </>
          )}

          {/* Read-only ticket detail sidebar for non-admin users */}
          {!isAdmin && (
            <Sheet
              open={!!selectedTicket}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedTicket(null)
                }
              }}
            >
              <SheetContent side="right" className="sm:max-w-lg">
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
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
