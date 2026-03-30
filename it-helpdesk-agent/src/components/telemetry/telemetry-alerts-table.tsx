"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Ticket } from "lucide-react";
import type { TelemetryAlert } from "@/lib/telemetry-data";

interface TelemetryAlertsTableProps {
  alerts: TelemetryAlert[];
}

const severityColors: Record<string, string> = {
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  critical:
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  analyzing:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
  ticket_created:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30",
};

const statusLabels: Record<string, string> = {
  new: "New",
  analyzing: "Analyzing",
  ticket_created: "Ticket Created",
};

export function TelemetryAlertsTable({ alerts }: TelemetryAlertsTableProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">Active Alerts</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {alerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Severity</TableHead>
              <TableHead className="text-xs">Server</TableHead>
              <TableHead className="text-xs">Metric</TableHead>
              <TableHead className="text-xs">Value</TableHead>
              <TableHead className="text-xs">Threshold</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Detected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${severityColors[alert.severity]}`}
                  >
                    {alert.severity.charAt(0).toUpperCase() +
                      alert.severity.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {alert.serverName}
                </TableCell>
                <TableCell className="text-xs">{alert.metric}</TableCell>
                <TableCell className="text-xs font-semibold tabular-nums">
                  {alert.currentValue}%
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {alert.threshold}%
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusColors[alert.status]}`}
                    >
                      {statusLabels[alert.status]}
                    </Badge>
                    {alert.ticketId && (
                      <a
                        href="/tickets"
                        className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                      >
                        <Ticket className="h-2.5 w-2.5" />
                        {alert.ticketId}
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground tabular-nums">
                  {format(new Date(alert.detectedAt), "HH:mm")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
