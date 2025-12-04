"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TicketSummaryCards } from "@/components/ticket-summary-cards"
import { TicketsTable } from "@/components/tickets-table"
import { Switch } from "@/components/ui/switch"
import { Ticket } from "@/lib/ticket-types"
import { toast } from "sonner"

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
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
              <p className="text-muted-foreground mt-1">Manage and track your support requests</p>
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
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
