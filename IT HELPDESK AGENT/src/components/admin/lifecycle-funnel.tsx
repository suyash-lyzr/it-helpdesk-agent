"use client"

import * as React from "react"
import { ArrowRight, Clock } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LifecycleStageData } from "@/lib/analytics-store"
import { Ticket } from "@/lib/ticket-types"

interface LifecycleFunnelProps {
  data: LifecycleStageData[]
  onStageClick?: (stage: string, tickets: Ticket[]) => void
}

const stageLabels: Record<string, string> = {
  new: "New",
  triage: "Triage",
  in_progress: "In Progress",
  waiting_for_user: "Waiting for User",
  resolved: "Resolved",
  closed: "Closed",
}

export function LifecycleFunnel({ data, onStageClick }: LifecycleFunnelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Lifecycle Funnel</CardTitle>
        <CardDescription>
          Ticket flow through stages with conversion rates and median times
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => {
            const isLast = index === data.length - 1
            const widthPercentage = stage.count > 0 
              ? Math.max((stage.count / data[0]?.count || 1) * 100, 10)
              : 0

            return (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="min-w-[100px]">
                      {stageLabels[stage.stage] || stage.stage}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {stage.count} tickets
                    </span>
                    {stage.conversionRate > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ({stage.conversionRate.toFixed(1)}% conversion)
                      </span>
                    )}
                    {stage.medianTime > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {stage.medianTime.toFixed(1)}h median
                      </div>
                    )}
                  </div>
                  {stage.tickets.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStageClick?.(stage.stage, stage.tickets)}
                    >
                      View Tickets ({stage.tickets.length})
                    </Button>
                  )}
                </div>
                <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${widthPercentage}%` }}
                  >
                    {stage.count > 0 && (
                      <span className="text-xs font-medium text-primary-foreground">
                        {stage.count}
                      </span>
                    )}
                  </div>
                </div>
                {!isLast && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

