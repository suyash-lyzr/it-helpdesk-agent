"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import {
  Clock,
  Users,
  Bell,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Download,
  Send,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { format, differenceInHours } from "date-fns";

// Helper function to format hours as "x Hr y Min"
function formatHoursMinutes(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0 && minutes === 0) {
    return "0 Min";
  }

  const parts: string[] = [];
  if (wholeHours > 0) {
    parts.push(`${wholeHours} Hr`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} Min`);
  }

  return parts.join(" ");
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AccessRequestAnalytics,
  AccessRequestKPI,
  PendingApproval,
  ManagerPerformance,
  AccessRequestInsight,
} from "@/lib/analytics-store";
import { toast } from "sonner";
import { addLiveEvent } from "@/lib/analytics-store";

interface AccessRequestAnalyticsProps {
  data: AccessRequestAnalytics;
  onSendReminder?: (approver: string, requestId?: string) => void;
  onEscalate?: (requestId: string) => void;
  onAutoApprove?: (requestId: string) => void;
  onBulkAction?: (action: string, requestIds: string[]) => void;
  onExportCSV?: (filteredData: PendingApproval[]) => void;
  onFilterByDate?: (date: string) => void;
  onFilterByManager?: (manager: string) => void;
}

const chartConfig = {
  volume: {
    label: "Volume",
    color: "hsl(221, 83%, 53%)",
  },
  movingAverage: {
    label: "7-day Avg",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig;

function KPITile({
  label,
  value,
  delta,
  trend,
  tooltip,
  icon: Icon,
}: {
  label: string;
  value: string | number | null;
  delta?: number | null;
  trend?: (number | null)[];
  tooltip?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const isPositive = delta !== null && delta !== undefined && delta >= 0;
  const deltaAbs = delta !== null && delta !== undefined ? Math.abs(delta) : 0;
  const displayValue = value === null ? "-" : value;

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">{label}</span>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="text-xl font-bold tabular-nums">{displayValue}</div>
          {delta !== null && delta !== undefined && (
            <div
              className={`flex items-center gap-1 mt-1 text-xs ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{deltaAbs.toFixed(1)}</span>
            </div>
          )}
        </div>
        {trend && trend.length > 0 && trend.some((v) => v !== null) && (
          <div className="w-16 h-8 ml-2">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart
                data={trend.map((v, i) => ({ value: v ?? 0, index: i }))}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-volume)"
                  fill="var(--color-volume)"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </Card>
  );
}

export function AccessRequestAnalyticsComponent({
  data,
  onSendReminder,
  onEscalate,
  onAutoApprove,
  onBulkAction,
  onExportCSV,
  onFilterByDate,
  onFilterByManager,
}: AccessRequestAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<"7" | "30" | "90">(
    "30"
  );
  const [selectedRequests, setSelectedRequests] = React.useState<Set<string>>(
    new Set()
  );
  const [automationToggles, setAutomationToggles] = React.useState({
    autoRemind: false,
    autoEscalate: false,
    autoApprove: false,
  });

  const handleSendReminder = (approver: string, requestId?: string) => {
    const event = addLiveEvent({
      type: "ticket_updated",
      description: `Reminder sent to ${approver}${
        requestId ? ` for Request ${requestId}` : ""
      }`,
      actor: "system",
    });
    toast.success(`Reminder sent to ${approver}`);
    onSendReminder?.(approver, requestId);
  };

  const handleEscalate = (requestId: string) => {
    const ticketId = `TKT-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;
    const event = addLiveEvent({
      type: "external_id_created",
      description: `Escalated Request ${requestId} to IAM team — Ticket ${ticketId} created (demo)`,
      actor: "system",
    });
    toast.success(`Escalated to IAM team — Ticket ${ticketId} (demo)`);
    onEscalate?.(requestId);
  };

  const handleAutoApprove = (requestId: string) => {
    const event = addLiveEvent({
      type: "ticket_updated",
      description: `Auto-approved Request ${requestId} (demo)`,
      actor: "system",
    });
    toast.success(`Request ${requestId} auto-approved (demo)`);
    onAutoApprove?.(requestId);
  };

  const handleBulkAction = (action: string) => {
    if (selectedRequests.size === 0) {
      toast.error("Please select at least one request");
      return;
    }
    const requestIds = Array.from(selectedRequests);
    if (action === "remind") {
      requestIds.forEach((id) => {
        const approval = data.pendingApprovals.find((a) => a.requestId === id);
        if (approval) handleSendReminder(approval.approver, id);
      });
    } else if (action === "escalate") {
      requestIds.forEach((id) => handleEscalate(id));
    }
    onBulkAction?.(action, requestIds);
    setSelectedRequests(new Set());
  };

  const handleExportCSV = () => {
    const csv = [
      [
        "Request ID",
        "Requester",
        "Department",
        "Application",
        "Requested",
        "Approver",
        "SLA Status",
        "Time Remaining/Overdue",
      ].join(","),
      ...data.pendingApprovals.map((a) =>
        [
          a.requestId,
          a.requester,
          a.department || "",
          a.application,
          format(new Date(a.requestedAt), "yyyy-MM-dd HH:mm"),
          a.approver,
          a.status,
          a.timeRemaining
            ? `${a.timeRemaining.toFixed(1)}h remaining`
            : a.timeOverdue
            ? `${a.timeOverdue.toFixed(1)}h overdue`
            : "N/A",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access-requests-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
    onExportCSV?.(data.pendingApprovals);
  };

  const toggleRequestSelection = (requestId: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const toggleAllRequests = () => {
    if (selectedRequests.size === data.pendingApprovals.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(
        new Set(data.pendingApprovals.map((a) => a.requestId))
      );
    }
  };

  const handleAutomationToggle = (key: keyof typeof automationToggles) => {
    const newValue = !automationToggles[key];
    setAutomationToggles((prev) => ({ ...prev, [key]: newValue }));

    const actionNames = {
      autoRemind: "Auto-remind approvers after 24h",
      autoEscalate: "Escalate to manager after 48h",
      autoApprove: "Auto-approve low-risk apps after 72h",
    };

    addLiveEvent({
      type: "ticket_updated",
      description: `${actionNames[key]} ${
        newValue ? "enabled" : "disabled"
      } (demo)`,
      actor: "system",
    });
    toast.info(
      `${actionNames[key]} ${newValue ? "enabled" : "disabled"} (demo)`
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>Access Request Analytics</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Access request analytics: trends, approver performance, and
                    SLA compliance for access and permission requests.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <CardDescription className="mt-1">
              Access request volume, approval performance, and compliance
              insights.
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 text-xs text-muted-foreground cursor-help underline">
                    Data sources
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Based on ticket history, approval logs, and scheduled
                    onboarding events.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPITile
            label="Pending Approvals"
            value={data.kpis.pending}
            delta={data.kpis.pendingDelta}
            trend={data.kpis.pendingTrend}
            tooltip="Number of access requests awaiting manager approval."
            icon={Users}
          />
          <KPITile
            label="Avg Approval Time"
            value={
              data.kpis.avgApprovalTime !== null
                ? formatHoursMinutes(data.kpis.avgApprovalTime)
                : "-"
            }
            delta={data.kpis.avgApprovalTimeDelta}
            trend={data.kpis.avgApprovalTimeTrend}
            tooltip="Average time taken by approvers to approve requests in the selected period."
            icon={Clock}
          />
          <KPITile
            label="SLA Compliance"
            value={
              data.kpis.slaCompliance !== null &&
              data.kpis.slaCompliance !== undefined
                ? `${data.kpis.slaCompliance.toFixed(1)}%`
                : "-"
            }
            delta={data.kpis.slaComplianceDelta}
            trend={data.kpis.slaComplianceTrend}
            tooltip="Percentage of approvals completed within the SLA target (default 24 hours)."
            icon={CheckCircle2}
          />
          <KPITile
            label="Overdue Approvals"
            value={data.kpis.overdue}
            delta={data.kpis.overdueDelta}
            trend={data.kpis.overdueTrend}
            tooltip="Requests that have exceeded the SLA threshold."
            icon={AlertCircle}
          />
        </div>

        {/* Trend Chart - Full Width */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Access Request Volume Trend
              </CardTitle>
              <Select
                value={selectedPeriod}
                onValueChange={(v) => setSelectedPeriod(v as "7" | "30" | "90")}
              >
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ComposedChart
                data={data.trendData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="volume"
                  fill="var(--color-volume)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="movingAverage"
                  stroke="var(--color-movingAverage)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Main Layout: Three Columns for Better Full-Width Utilization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column 1: Top Applications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Top Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Application</TableHead>
                    <TableHead className="text-xs text-right">
                      Requests
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      Avg Time
                    </TableHead>
                    <TableHead className="text-xs text-right">SLA %</TableHead>
                    <TableHead className="text-xs w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topApplications.length > 0 ? (
                    data.topApplications.map((app, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-xs">
                          {app.name}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {app.requests}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {app.avgApprovalTime > 0
                            ? formatHoursMinutes(app.avgApprovalTime)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              app.slaCompliance >= 90
                                ? "bg-green-500/10 text-green-700 border-green-500/20"
                                : app.slaCompliance >= 70
                                ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                                : "bg-red-500/10 text-red-700 border-red-500/20"
                            }`}
                          >
                            {app.slaCompliance !== null &&
                            app.slaCompliance !== undefined
                              ? `${app.slaCompliance.toFixed(1)}%`
                              : "-"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-xs text-muted-foreground py-4"
                      >
                        No access request data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Slowest Approvers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Slowest Approvers</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {data.slowestApprovers.length > 0 ? (
                  data.slowestApprovers.slice(0, 5).map((manager, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {manager.manager}
                        </div>
                        <div className="text-muted-foreground">
                          {manager.avgApprovalTime > 0
                            ? `${formatHoursMinutes(
                                manager.avgApprovalTime
                              )} avg • ${manager.requestCount} req`
                            : `${manager.requestCount} req`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleSendReminder(manager.manager)}
                      >
                        <Send className="h-2.5 w-2.5 mr-1" />
                        Remind
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No approver data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Recommended Automations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recommended Automations</CardTitle>
              <CardDescription className="text-xs">
                AI-driven suggestions based on your metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.automationRecommendations.map((rec) => {
                const isEnabled =
                  automationToggles[
                    rec.id === "auto-remind-24h"
                      ? "autoRemind"
                      : rec.id === "auto-escalate-48h"
                      ? "autoEscalate"
                      : "autoApprove"
                  ] || false;

                return (
                  <div
                    key={rec.id}
                    className={`rounded-md border p-3 ${
                      rec.recommended
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Label
                            htmlFor={rec.id}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            {rec.name}
                          </Label>
                          {rec.recommended && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-green-500/10 text-green-700 border-green-500/20"
                            >
                              Recommended
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              rec.riskLevel === "high"
                                ? "bg-red-500/10 text-red-700 border-red-500/20"
                                : rec.riskLevel === "medium"
                                ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                                : "bg-green-500/10 text-green-700 border-green-500/20"
                            }`}
                          >
                            {rec.riskLevel} risk
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {rec.description}
                        </p>
                        {rec.reason && (
                          <p className="text-[10px] text-muted-foreground/70 mt-1.5 italic">
                            {rec.reason}
                          </p>
                        )}
                        {rec.potentialImpact && rec.recommended && (
                          <p className="text-[10px] text-primary/80 mt-1 font-medium">
                            💡 {rec.potentialImpact}
                          </p>
                        )}
                      </div>
                      <Switch
                        id={rec.id}
                        checked={isEnabled}
                        onCheckedChange={() =>
                          handleAutomationToggle(
                            rec.id === "auto-remind-24h"
                              ? "autoRemind"
                              : rec.id === "auto-escalate-48h"
                              ? "autoEscalate"
                              : "autoApprove"
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Risk & Insights - Full Width */}
        {data.insights.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Risk & Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`rounded-md border p-3 ${
                    insight.severity === "high"
                      ? "border-destructive/30 bg-destructive/5"
                      : insight.severity === "medium"
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-blue-500/30 bg-blue-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm mb-1">
                        {insight.title}
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        {insight.description}
                      </p>
                    </div>
                    {insight.severity === "high" && (
                      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {insight.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant={action.primary ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={() => {
                          if (action.label.includes("Notify")) {
                            toast.success(`${action.label} (demo)`);
                          } else if (action.label.includes("Create")) {
                            const ticketId = `TKT-${Math.floor(
                              Math.random() * 10000
                            )
                              .toString()
                              .padStart(4, "0")}`;
                            addLiveEvent({
                              type: "external_id_created",
                              description: `${action.label} — Ticket ${ticketId} created (demo)`,
                              actor: "system",
                            });
                            toast.success(`Ticket ${ticketId} created (demo)`);
                          } else if (action.label.includes("Schedule")) {
                            toast.success(`${action.label} (demo)`);
                          }
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pending Approvals List - Full Width Below */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Pending Approvals</CardTitle>
              <div className="flex items-center gap-2">
                {selectedRequests.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleBulkAction("remind")}
                  >
                    Bulk Remind ({selectedRequests.size})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleExportCSV}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          selectedRequests.size === data.pendingApprovals.length
                        }
                        onCheckedChange={toggleAllRequests}
                      />
                    </TableHead>
                    <TableHead className="text-xs">Request ID</TableHead>
                    <TableHead className="text-xs">Requester</TableHead>
                    <TableHead className="text-xs">Application</TableHead>
                    <TableHead className="text-xs">Requested</TableHead>
                    <TableHead className="text-xs">Approver</TableHead>
                    <TableHead className="text-xs">SLA Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pendingApprovals.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        No Pending Approvals
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.pendingApprovals.slice(0, 10).map((approval) => (
                      <TableRow key={approval.requestId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRequests.has(approval.requestId)}
                            onCheckedChange={() =>
                              toggleRequestSelection(approval.requestId)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {approval.requestId}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{approval.requester}</div>
                          {approval.department && (
                            <div className="text-muted-foreground text-[10px]">
                              {approval.department}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {approval.application}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(
                            new Date(approval.requestedAt),
                            "MMM d, HH:mm"
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {approval.approver}
                        </TableCell>
                        <TableCell>
                          {approval.status === "breached" ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px]"
                            >
                              {approval.timeOverdue
                                ? `${Math.floor(approval.timeOverdue)}h overdue`
                                : "Breached"}
                            </Badge>
                          ) : approval.status === "overdue" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                            >
                              {approval.timeOverdue
                                ? `${Math.floor(approval.timeOverdue)}h overdue`
                                : "Overdue"}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-green-500/10 text-green-700 border-green-500/20"
                            >
                              {approval.timeRemaining
                                ? `${Math.floor(approval.timeRemaining)}h left`
                                : "Pending"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() =>
                                handleSendReminder(
                                  approval.approver,
                                  approval.requestId
                                )
                              }
                            >
                              <Bell className="h-2.5 w-2.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() => handleEscalate(approval.requestId)}
                            >
                              Escalate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() =>
                                handleAutoApprove(approval.requestId)
                              }
                            >
                              Auto-approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
