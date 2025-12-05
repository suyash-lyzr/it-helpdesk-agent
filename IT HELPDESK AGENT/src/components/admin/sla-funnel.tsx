"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { SLAFunnelData } from "@/lib/analytics-store"
import { Ticket } from "@/lib/ticket-types"

interface SLAFunnelProps {
  data: SLAFunnelData[]
  onSegmentClick?: (priority: string, breachedTickets: Ticket[]) => void
}

const chartConfig = {
  meetingSLA: {
    label: "Meeting SLA",
    color: "hsl(142, 76%, 36%)",
  },
  breached: {
    label: "Breached",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig

export function SLAFunnel({ data, onSegmentClick }: SLAFunnelProps) {
  const [selectedPriority, setSelectedPriority] = React.useState<string | null>(null)
  const [breachedTickets, setBreachedTickets] = React.useState<Ticket[]>([])

  const handleSegmentClick = (priority: string, tickets: Ticket[]) => {
    setSelectedPriority(priority)
    setBreachedTickets(tickets)
    onSegmentClick?.(priority, tickets)
  }

  // Prepare chart data
  const chartData = data.map((item) => ({
    priority: item.priority,
    meetingSLA: item.meetingSLA,
    breached: item.breached,
    total: item.total,
    slaPercentage: item.slaPercentage,
  }))

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>SLA & Priority Funnel</CardTitle>
          <CardDescription>
            Ticket distribution by priority and SLA compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="meetingSLA" stackId="a" fill="var(--color-meetingSLA)" />
              <Bar dataKey="breached" stackId="a" fill="var(--color-breached)" />
            </BarChart>
          </ChartContainer>

          <div className="mt-6 space-y-3">
            {data.map((item) => (
              <div
                key={item.priority}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleSegmentClick(item.priority, item.breachedTickets)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">{item.priority}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.total} tickets
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{item.meetingSLA} meeting SLA</span>
                  </div>
                  {item.breached > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <Badge variant="destructive">{item.breached} breached</Badge>
                    </div>
                  )}
                  <div className="text-sm font-medium">
                    {item.slaPercentage.toFixed(1)}% compliance
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPriority} onOpenChange={() => setSelectedPriority(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Breached Tickets - {selectedPriority}</DialogTitle>
            <DialogDescription>
              {breachedTickets.length} ticket(s) have breached SLA for {selectedPriority} priority
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {breachedTickets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No breached tickets for this priority
              </p>
            ) : (
              <div className="space-y-2">
                {breachedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-lg border p-3 hover:bg-accent"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.id} • {ticket.user_name}
                        </div>
                      </div>
                      <Badge variant="destructive">Breached</Badge>
                    </div>
                    {ticket.sla_due_at && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        SLA Due: {new Date(ticket.sla_due_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

