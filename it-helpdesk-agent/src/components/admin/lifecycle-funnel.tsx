"use client"

import * as React from "react"
import { 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  FileText, 
  Search, 
  Settings, 
  CheckCircle2, 
  Lock 
} from "lucide-react"
import {
  Card,
  CardAction,
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
  resolved: "Resolved",
  closed: "Closed",
}

const stageIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  new: FileText,
  triage: Search,
  in_progress: Settings,
  resolved: CheckCircle2,
  closed: Lock,
}

export function LifecycleFunnel({ data, onStageClick }: LifecycleFunnelProps) {
  // Filter out "waiting_for_user" stage
  const filteredData = data.filter((stage) => stage.stage !== "waiting_for_user")
  const totalTickets = filteredData.reduce((sum, stage) => sum + stage.count, 0)
  const maxCount = Math.max(...filteredData.map((s) => s.count), 1)

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Ticket Lifecycle Funnel</CardTitle>
        <CardDescription>
          Ticket flow through stages with conversion rates and median times
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className="text-xs">
            {totalTickets} total
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="space-y-3">
          {filteredData.map((stage, index) => {
            const isLast = index === filteredData.length - 1
            const widthPercentage = stage.count > 0 
              ? Math.max((stage.count / maxCount) * 100, 8)
              : 0
            const prevStage = index > 0 ? filteredData[index - 1] : null
            const conversionFromPrev = prevStage && prevStage.count > 0
              ? (stage.count / prevStage.count) * 100
              : 0

            return (
              <React.Fragment key={stage.stage}>
                <div
                  className="group rounded-lg border bg-muted/40 p-3 transition-all hover:bg-accent hover:shadow-sm cursor-pointer"
                  onClick={() => stage.tickets.length > 0 && onStageClick?.(stage.stage, stage.tickets)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {(() => {
                          const IconComponent = stageIcons[stage.stage] || FileText
                          return (
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                              <IconComponent className="h-4 w-4 text-primary" />
                            </div>
                          )
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold text-sm">
                            {stageLabels[stage.stage] || stage.stage}
                          </span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {stage.count} {stage.count === 1 ? 'ticket' : 'tickets'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {prevStage && prevStage.count > 0 && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{conversionFromPrev.toFixed(1)}% from {stageLabels[prevStage.stage]}</span>
                            </div>
                          )}
                          {stage.medianTime > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="tabular-nums">{stage.medianTime.toFixed(1)}h median</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {stage.tickets.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          onStageClick?.(stage.stage, stage.tickets)
                        }}
                      >
                        View ({stage.tickets.length})
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 relative h-6 bg-muted rounded-md overflow-hidden">
                    {stage.count > 0 ? (
                      <div
                        className="h-full bg-primary/80 transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${widthPercentage}%` }}
                      >
                        <span className="text-[10px] font-medium text-primary-foreground tabular-nums">
                          {stage.count}
                        </span>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground">No tickets</span>
                      </div>
                    )}
                  </div>
                </div>
                {!isLast && (
                  <div className="flex justify-center -my-1">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

