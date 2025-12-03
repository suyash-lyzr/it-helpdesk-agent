"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Ticket, Circle, Clock, CheckCircle2, AlertCircle } from "lucide-react"

interface TicketSummaryCardsProps {
  total: number
  new_count: number
  open: number
  inProgress: number
  resolved: number
}

export function TicketSummaryCards({
  total,
  new_count,
  open,
  inProgress,
  resolved,
}: TicketSummaryCardsProps) {
  const cards = [
    {
      title: "Total Tickets",
      count: total,
      icon: Ticket,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      title: "New",
      count: new_count,
      icon: AlertCircle,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      title: "Open",
      count: open,
      icon: Circle,
      iconColor: "text-red-500",
      iconBg: "bg-red-50 dark:bg-red-500/10",
    },
    {
      title: "In Progress",
      count: inProgress,
      icon: Clock,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      title: "Resolved",
      count: resolved,
      icon: CheckCircle2,
      iconColor: "text-green-500",
      iconBg: "bg-green-50 dark:bg-green-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold">{card.count}</p>
              </div>
              <div className={`p-3 rounded-full ${card.iconBg}`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
