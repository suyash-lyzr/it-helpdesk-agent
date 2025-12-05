"use client"

import * as React from "react"
import { format } from "date-fns"
import { Activity, Circle, Play, Ticket, AlertTriangle, CheckCircle2, ExternalLink, Clock } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LiveEvent } from "@/lib/analytics-store"

interface LiveActivityFeedProps {
  events: LiveEvent[]
  onReplay?: (eventType: string) => void
  lastUpdated?: Date
}

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ticket_created: Ticket,
  ticket_updated: Activity,
  sla_breached: AlertTriangle,
  external_id_created: ExternalLink,
  approval_pending: Clock,
}

const eventColors: Record<string, string> = {
  ticket_created: "text-blue-600",
  ticket_updated: "text-purple-600",
  sla_breached: "text-red-600",
  external_id_created: "text-green-600",
  approval_pending: "text-yellow-600",
}

const sampleEvents = [
  { value: "ticket_created", label: "Ticket Created" },
  { value: "ticket_updated", label: "Ticket Updated" },
  { value: "sla_breached", label: "SLA Breached" },
  { value: "external_id_created", label: "External ID Created" },
  { value: "approval_pending", label: "Approval Pending" },
]

export function LiveActivityFeed({ events, onReplay, lastUpdated }: LiveActivityFeedProps) {
  const [selectedEvent, setSelectedEvent] = React.useState<string>("")
  const [isLive, setIsLive] = React.useState(true)

  const handleReplay = () => {
    if (selectedEvent && onReplay) {
      onReplay(selectedEvent)
      setSelectedEvent("")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>
              Real-time updates and webhook events
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-2">
                <Circle className="h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            )}
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {format(lastUpdated, "HH:mm:ss")}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select event to replay" />
              </SelectTrigger>
              <SelectContent>
                {sampleEvents.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleReplay}
              disabled={!selectedEvent}
              size="sm"
            >
              <Play className="h-3 w-3 mr-1" />
              Replay
            </Button>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No events yet
                </div>
              ) : (
                events.map((event) => {
                  const Icon = eventIcons[event.type] || Activity
                  const color = eventColors[event.type] || "text-gray-600"

                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
                    >
                      <Icon className={`h-4 w-4 mt-0.5 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{event.description}</span>
                          {event.externalId && (
                            <Badge variant="outline" className="text-xs">
                              {event.externalId}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {event.ticketId && (
                            <span className="font-mono">{event.ticketId}</span>
                          )}
                          {event.actor && <span>by {event.actor}</span>}
                          <span>•</span>
                          <span>{format(new Date(event.timestamp), "MMM d, HH:mm:ss")}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

