"use client";

import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KPIMetrics } from "@/lib/analytics-store";

interface KPICardsProps {
  metrics: KPIMetrics;
  onKpiClick?: (filter: string) => void;
}

const metricDescriptions: Record<string, { trend: string; subtitle: string }> =
  {
    totalTickets: {
      trend: "Total tickets created",
      subtitle: "Tickets for the selected period",
    },
    open: {
      trend: "Open tickets waiting for action",
      subtitle: "Requires immediate attention",
    },
    inProgress: {
      trend: "Tickets being actively worked on",
      subtitle: "Teams are resolving issues",
    },
    resolved: {
      trend: "Tickets resolved and closed",
      subtitle: "Successfully completed",
    },
    mttr: {
      trend: "Mean time to resolution",
      subtitle: "Average resolution time",
    },
    firstResponseTime: {
      trend: "First response time",
      subtitle: "Average time to first contact",
    },
    slaCompliance: {
      trend: "SLA compliance rate",
      subtitle: "Tickets meeting SLA targets",
    },
    csat: {
      trend: "Customer satisfaction score",
      subtitle: "Average satisfaction rating",
    },
  };

function formatValue(value: number, type: string): string {
  // Show "-" when value is 0 for time-based metrics (no data to calculate)
  if (type === "mttr" || type === "firstResponseTime") {
    if (value === 0) {
      return "-";
    }
    if (value < 1) {
      // Show minutes for sub-hour values to avoid 0.0h readout
      return `${Math.round(value * 60)}m`;
    }
    return `${value.toFixed(1)}h`;
  }
  if (type === "slaCompliance" || type === "csat") {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString();
}

function KPICard({
  title,
  value,
  delta,
  type,
  description,
  onClick,
  totalTickets,
}: {
  title: string;
  value: number | null;
  delta: number | null;
  type: string;
  description: { trend: string; subtitle: string };
  onClick?: () => void;
  totalTickets?: number;
}) {
  const isPositive = delta !== null && delta >= 0;
  const DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  // Show "-" when value is null (no data to calculate) or when there are no tickets
  const shouldShowDash =
    value === null ||
    ((type === "slaCompliance" || type === "csat") &&
    totalTickets !== undefined &&
      totalTickets === 0);

  return (
    <Card
      className="@container/card cursor-pointer transition-shadow hover:shadow-sm"
      onClick={onClick}
    >
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {shouldShowDash ? "-" : formatValue(value!, type)}
        </CardTitle>
        <CardAction>
          {delta !== null ? (
          <Badge variant="outline">
            <DeltaIcon className="h-3 w-3" />
            {isPositive ? "+" : ""}
            {delta.toFixed(1)}%
          </Badge>
          ) : (
            <Badge variant="outline" className="opacity-50">
              -
            </Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 pb-3 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {description.trend} <DeltaIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">{description.subtitle}</div>
      </CardFooter>
    </Card>
  );
}

function TicketStatusSummary({
  metrics,
  onKpiClick,
}: {
  metrics: KPIMetrics;
  onKpiClick?: (filter: string) => void;
}) {
  const DeltaIcon =
    metrics.totalTicketsDelta >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="@container/card col-span-full">
      <CardHeader>
        <CardDescription>Ticket Status Summary</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {metrics.totalTickets} Total
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <DeltaIcon className="h-3 w-3" />
            {metrics.totalTicketsDelta >= 0 ? "+" : ""}
            {metrics.totalTicketsDelta.toFixed(1)}%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="pt-0 pb-3">
        <div className="grid w-full grid-cols-3 gap-3">
          <div
            className="cursor-pointer rounded-md border bg-muted/40 p-2.5 transition-colors hover:bg-accent"
            onClick={() => onKpiClick?.("status:open")}
          >
            <div className="text-xs text-muted-foreground">Open</div>
            <div className="text-lg font-semibold tabular-nums">
              {metrics.open}
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              {metrics.openDelta >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span
                className={`text-xs ${
                  metrics.openDelta >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {metrics.openDelta >= 0 ? "+" : ""}
                {metrics.openDelta.toFixed(1)}%
              </span>
            </div>
          </div>
          <div
            className="cursor-pointer rounded-md border bg-muted/40 p-2.5 transition-colors hover:bg-accent"
            onClick={() => onKpiClick?.("status:in_progress")}
          >
            <div className="text-xs text-muted-foreground">In Progress</div>
            <div className="text-lg font-semibold tabular-nums">
              {metrics.inProgress}
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              {metrics.inProgressDelta >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span
                className={`text-xs ${
                  metrics.inProgressDelta >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {metrics.inProgressDelta >= 0 ? "+" : ""}
                {metrics.inProgressDelta.toFixed(1)}%
              </span>
            </div>
          </div>
          <div
            className="cursor-pointer rounded-md border bg-muted/40 p-2.5 transition-colors hover:bg-accent"
            onClick={() => onKpiClick?.("status:resolved")}
          >
            <div className="text-xs text-muted-foreground">Resolved</div>
            <div className="text-lg font-semibold tabular-nums">
              {metrics.resolved}
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              {metrics.resolvedDelta >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span
                className={`text-xs ${
                  metrics.resolvedDelta >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {metrics.resolvedDelta >= 0 ? "+" : ""}
                {metrics.resolvedDelta.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export function KPICards({ metrics, onKpiClick }: KPICardsProps) {
  return (
    <div className="mx-6 lg:mx-8">
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {/* Priority Performance Metrics - Top Row */}
        <KPICard
          title="MTTR"
          value={metrics.mttr}
          delta={metrics.mttrDelta}
          type="mttr"
          description={metricDescriptions.mttr}
          onClick={() => onKpiClick?.("metric:mttr")}
          totalTickets={metrics.totalTickets}
        />
        <KPICard
          title="First Response Time"
          value={metrics.firstResponseTime}
          delta={metrics.firstResponseTimeDelta}
          type="firstResponseTime"
          description={metricDescriptions.firstResponseTime}
          onClick={() => onKpiClick?.("metric:frt")}
          totalTickets={metrics.totalTickets}
        />
        <KPICard
          title="SLA Compliance"
          value={metrics.slaCompliance}
          delta={metrics.slaComplianceDelta}
          type="slaCompliance"
          description={metricDescriptions.slaCompliance}
          onClick={() => onKpiClick?.("metric:sla")}
          totalTickets={metrics.totalTickets}
        />
        <KPICard
          title="CSAT"
          value={metrics.csat}
          delta={metrics.csatDelta}
          type="csat"
          description={metricDescriptions.csat}
          onClick={() => onKpiClick?.("metric:csat")}
          totalTickets={metrics.totalTickets}
        />

        {/* Ticket Status Summary - Compact Card */}
        <TicketStatusSummary metrics={metrics} onKpiClick={onKpiClick} />
      </div>
    </div>
  );
}
