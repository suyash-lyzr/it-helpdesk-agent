"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { SLAFunnelData } from "@/lib/analytics-store";
import { Ticket } from "@/lib/ticket-types";

interface SLAFunnelProps {
  data: SLAFunnelData[];
  onSegmentClick?: (priority: string, breachedTickets: Ticket[]) => void;
}

const chartConfig = {
  meetingSLA: {
    label: "Meeting SLA",
    color: "var(--color-primary)",
  },
  breached: {
    label: "Breached",
    color: "var(--color-destructive)",
  },
} satisfies ChartConfig;

export function SLAFunnel({ data, onSegmentClick }: SLAFunnelProps) {
  const [selectedPriority, setSelectedPriority] = React.useState<string | null>(
    null
  );
  const [breachedTickets, setBreachedTickets] = React.useState<Ticket[]>([]);

  const handleSegmentClick = (priority: string, tickets: Ticket[]) => {
    setSelectedPriority(priority);
    setBreachedTickets(tickets);
    onSegmentClick?.(priority, tickets);
  };

  // Prepare chart data
  const chartData = data.map((item) => ({
    priority: item.priority,
    meetingSLA: item.meetingSLA,
    breached: item.breached,
    total: item.total,
    slaPercentage: item.slaPercentage,
  }));

  const totalTickets = data.reduce((sum, item) => sum + item.total, 0);
  const totalBreached = data.reduce((sum, item) => sum + item.breached, 0);
  const overallCompliance =
    totalTickets > 0
      ? (((totalTickets - totalBreached) / totalTickets) * 100).toFixed(1)
      : "-";

  return (
    <>
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>SLA & Priority Funnel</CardTitle>
          <CardDescription>
            Ticket distribution by priority and SLA compliance status
          </CardDescription>
          <CardAction>
            <Badge variant="outline" className="text-xs">
              {overallCompliance === "-" ? "-" : `${overallCompliance}%`}{" "}
              overall
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="priority"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="meetingSLA"
                stackId="a"
                fill="var(--color-meetingSLA)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="breached"
                stackId="a"
                fill="var(--color-breached)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>

          <div className="mt-6 space-y-2">
            {data.map((item) => (
              <div
                key={item.priority}
                className="group flex items-center justify-between rounded-lg border bg-muted/40 p-3 transition-all hover:bg-accent hover:shadow-sm cursor-pointer"
                onClick={() =>
                  handleSegmentClick(item.priority, item.breachedTickets)
                }
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {item.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.total} {item.total === 1 ? "ticket" : "tickets"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground">
                          {item.meetingSLA} meeting SLA
                        </span>
                      </div>
                      {item.breached > 0 && (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          <Badge
                            variant="destructive"
                            className="text-xs px-1.5 py-0"
                          >
                            {item.breached} breached
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {item.slaPercentage !== null
                        ? `${item.slaPercentage.toFixed(1)}%`
                        : "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      compliance
                    </div>
                  </div>
                  {item.slaPercentage !== null &&
                    (item.slaPercentage >= 100 ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedPriority}
        onOpenChange={() => setSelectedPriority(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Breached Tickets - {selectedPriority}</DialogTitle>
            <DialogDescription>
              {breachedTickets.length} ticket(s) have breached SLA for{" "}
              {selectedPriority} priority
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
                    className="rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {ticket.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {ticket.id} • {ticket.user_name}
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Breached
                      </Badge>
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
  );
}
