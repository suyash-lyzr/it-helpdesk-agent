"use client"

import * as React from "react"
import { format } from "date-fns"
import { AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ticket } from "@/lib/ticket-types"

interface SLABreachDiagnosticsProps {
  ticket: Ticket
}

// Root causes for SLA breaches
// const rootCauses = [
//   "No assignment",
//   "Awaiting approval",
//   "Vendor delay",
//   "Reopened",
//   "Waiting for user response",
// ]

export function SLABreachDiagnostics({ ticket }: SLABreachDiagnosticsProps) {
  // Mock timeline data
  const timeline = [
    {
      stage: "Created",
      timestamp: ticket.created_at,
      duration: 0,
      status: "completed",
    },
    {
      stage: "Assigned",
      timestamp: ticket.assignee ? ticket.updated_at : null,
      duration: ticket.assignee ? 2 : null,
      status: ticket.assignee ? "completed" : "delayed",
    },
    {
      stage: "In Progress",
      timestamp: ticket.status === "in_progress" ? ticket.updated_at : null,
      duration: ticket.status === "in_progress" ? 4 : null,
      status: ticket.status === "in_progress" ? "completed" : "pending",
    },
    {
      stage: "Resolved",
      timestamp: ticket.resolved_at || null,
      duration: ticket.resolved_at ? 8 : null,
      status: ticket.resolved_at ? "completed" : "pending",
    },
  ]

  const totalTime = timeline.reduce((sum, item) => sum + (item.duration || 0), 0)
  const delayedStages = timeline.filter((item) => item.status === "delayed")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          SLA Breach Diagnostics
        </CardTitle>
        <CardDescription>
          Root cause analysis and timeline for ticket {ticket.id}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="text-sm font-semibold mb-2">Root Cause Analysis</div>
            <div className="space-y-2">
              {delayedStages.length > 0 ? (
                delayedStages.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>
                      <strong>{stage.stage}</strong> stage delayed
                      {stage.duration && ` (${stage.duration}h)`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No specific root cause identified
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">Timeline & Time Spent</div>
            <div className="space-y-3">
              {timeline.map((item, index) => {
                const isLast = index === timeline.length - 1
                const widthPercentage = item.duration
                  ? Math.max((item.duration / totalTime) * 100, 5)
                  : 0

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {item.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : item.status === "delayed" ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">{item.stage}</span>
                        {item.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.timestamp), "MMM d, HH:mm")}
                          </span>
                        )}
                      </div>
                      {item.duration && (
                        <Badge variant="outline" className="text-xs">
                          {item.duration}h
                        </Badge>
                      )}
                    </div>
                    {item.duration && (
                      <div className="relative h-4 bg-muted rounded-md overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            item.status === "delayed"
                              ? "bg-red-500"
                              : item.status === "completed"
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                          style={{ width: `${widthPercentage}%` }}
                        />
                      </div>
                    )}
                    {!isLast && (
                      <div className="flex justify-center my-1">
                        <div className="h-2 w-0.5 bg-border" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-semibold mb-2">Summary</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Time</div>
                <div className="font-semibold">{totalTime}h</div>
              </div>
              <div>
                <div className="text-muted-foreground">Delayed Stages</div>
                <div className="font-semibold">{delayedStages.length}</div>
              </div>
              {ticket.sla_due_at && (
                <>
                  <div>
                    <div className="text-muted-foreground">SLA Due</div>
                    <div className="font-semibold">
                      {format(new Date(ticket.sla_due_at), "MMM d, HH:mm")}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <Badge variant="destructive">Breached</Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

