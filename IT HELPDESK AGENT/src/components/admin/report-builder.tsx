"use client";

import * as React from "react";
import { Download, FileText, Play, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { addLiveEvent } from "@/lib/analytics-store";

interface ReportBuilderProps {
  onGenerateReport?: (config: ReportConfig) => void;
  scheduledReports?: ScheduledReport[];
  onReportsUpdated?: () => void;
}

interface ReportConfig {
  name?: string;
  metrics: string[];
  format: "csv" | "pdf";
  dateRange?: { start: string; end: string };
  schedule?: {
    frequency: "daily" | "weekly" | "monthly";
    recipients: string[];
  };
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly" | "none";
  recipients: string[];
  createdAt: string;
  lastRun?: string;
  metrics: string[];
  format: "csv" | "pdf";
}

const availableMetrics = [
  { id: "kpis", label: "KPI Metrics" },
  { id: "sla_funnel", label: "SLA Funnel" },
  { id: "team_performance", label: "Team Performance" },
  { id: "access_requests", label: "Access Requests" },
  { id: "ticket_list", label: "Ticket List" },
];

// Seed data
const seedReports: ScheduledReport[] = [
  {
    id: "report-1",
    name: "Weekly SLA Summary",
    frequency: "weekly",
    recipients: ["admin@company.com"],
    createdAt: subDays(new Date(), 7).toISOString(),
    lastRun: subDays(new Date(), 1).toISOString(),
    metrics: ["kpis", "sla_funnel"],
    format: "csv",
  },
  {
    id: "report-2",
    name: "Monthly Team Performance",
    frequency: "monthly",
    recipients: ["ops-leads@company.com"],
    createdAt: subDays(new Date(), 30).toISOString(),
    lastRun: subDays(new Date(), 5).toISOString(),
    metrics: ["team_performance"],
    format: "pdf",
  },
  {
    id: "report-3",
    name: "Ad-hoc Ticket Export",
    frequency: "none",
    recipients: [],
    createdAt: new Date().toISOString(),
    lastRun: new Date().toISOString(),
    metrics: ["ticket_list"],
    format: "csv",
  },
];

export function ReportBuilder({
  onGenerateReport,
  scheduledReports = [],
  onReportsUpdated,
}: ReportBuilderProps) {
  const [open, setOpen] = React.useState(false);
  const [reports, setReports] = React.useState<ScheduledReport[]>(
    scheduledReports.length > 0 ? scheduledReports : seedReports
  );
  const [reportName, setReportName] = React.useState("");
  const [selectedMetrics, setSelectedMetrics] = React.useState<string[]>([]);
  const [exportFormat, setExportFormat] = React.useState<"csv" | "pdf">("csv");
  const [dateRange, setDateRange] = React.useState<"7" | "30" | "90" | "custom">("30");
  const [customStartDate, setCustomStartDate] = React.useState("");
  const [customEndDate, setCustomEndDate] = React.useState("");
  const [scheduleFrequency, setScheduleFrequency] = React.useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [scheduleRecipients, setScheduleRecipients] = React.useState("");

  React.useEffect(() => {
    if (scheduledReports.length > 0) {
      setReports(scheduledReports);
    }
  }, [scheduledReports]);

  const generateMockFile = (config: ReportConfig) => {
    const fileName = `${config.name || "report"}-${Date.now()}.${config.format}`;
    const content = config.format === "csv"
      ? "Metric,Value,Date\nKPI 1,100,2024-01-01\nKPI 2,200,2024-01-01"
      : "Mock PDF content (demo)";

    const blob = new Blob([content], {
      type: config.format === "csv" ? "text/csv" : "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = () => {
    if (selectedMetrics.length === 0) {
      toast.error("Please select at least one metric");
      return;
    }

    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }

    const now = new Date();
    let startDate: string;
    let endDate: string = format(now, "yyyy-MM-dd");

    if (dateRange === "custom") {
      if (!customStartDate || !customEndDate) {
        toast.error("Please select custom date range");
        return;
      }
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      startDate = format(subDays(now, parseInt(dateRange)), "yyyy-MM-dd");
    }

    const config: ReportConfig = {
      name: reportName,
      metrics: selectedMetrics,
      format: exportFormat,
      dateRange: { start: startDate, end: endDate },
    };

    if (scheduleFrequency !== "none") {
      if (!scheduleRecipients.trim()) {
        toast.error("Please enter recipient emails for scheduled reports");
        return;
      }
      config.schedule = {
        frequency: scheduleFrequency,
        recipients: scheduleRecipients.split(",").map((e) => e.trim()).filter(Boolean),
      };

      // Create scheduled report
      const newReport: ScheduledReport = {
        id: `report-${Date.now()}`,
        name: reportName,
        frequency: scheduleFrequency,
        recipients: config.schedule.recipients,
        createdAt: new Date().toISOString(),
        metrics: selectedMetrics,
        format,
      };
      setReports((prev) => [newReport, ...prev]);
      addLiveEvent({
        type: "automation_fired",
        actor: "System",
        description: `Scheduled report '${reportName}' created (demo)`,
        headline: `Scheduled report '${reportName}' created (demo)`,
        details: `Frequency: ${scheduleFrequency}, Recipients: ${config.schedule.recipients.length}`,
        category: "automations",
        severity: "low",
      });
      toast.success(`Scheduled report '${reportName}' created (demo)`);
    } else {
      // Generate one-off report
      generateMockFile(config);
      addLiveEvent({
        type: "automation_fired",
        actor: "System",
        description: `Report '${reportName}' generated (demo)`,
        headline: `Report '${reportName}' generated (demo)`,
        details: `Format: ${exportFormat.toUpperCase()}, Metrics: ${selectedMetrics.length}`,
        category: "automations",
        severity: "low",
      });
      toast.success(`Report '${reportName}' generated (demo)`);
    }

    onGenerateReport?.(config);
    onReportsUpdated?.();
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setReportName("");
    setSelectedMetrics([]);
    setExportFormat("csv");
    setDateRange("30");
    setCustomStartDate("");
    setCustomEndDate("");
    setScheduleFrequency("none");
    setScheduleRecipients("");
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId)
        ? prev.filter((id) => id !== metricId)
        : [...prev, metricId]
    );
  };

  const handleRunNow = (report: ScheduledReport) => {
    generateMockFile({
      name: report.name,
      metrics: report.metrics,
      format: report.format,
    });
    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id ? { ...r, lastRun: new Date().toISOString() } : r
      )
    );
    addLiveEvent({
      type: "automation_fired",
      actor: "System",
      description: `Report '${report.name}' run manually (demo)`,
      headline: `Report '${report.name}' run manually (demo)`,
      details: `Format: ${report.format.toUpperCase()}`,
      category: "automations",
      severity: "low",
    });
    toast.success(`Report '${report.name}' generated (demo)`);
    onReportsUpdated?.();
  };

  const handleDelete = (reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    toast.success("Report deleted (demo)");
    onReportsUpdated?.();
  };

  const handleDownload = (report: ScheduledReport) => {
    generateMockFile({
      name: report.name,
      metrics: report.metrics,
      format: report.format,
    });
    toast.success(`Report '${report.name}' downloaded (demo)`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Report Builder & Export
        </CardTitle>
        <CardDescription>
          Create one-off exports or schedule recurring reports for SLA, team performance, and access request metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Build Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Build Custom Report</DialogTitle>
              <DialogDescription>
                Select metrics and configure export settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Weekly SLA Summary"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="mb-3 block">Select Metrics</Label>
                <div className="space-y-2">
                  {availableMetrics.map((metric) => (
                    <div key={metric.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={metric.id}
                        checked={selectedMetrics.includes(metric.id)}
                        onCheckedChange={() => toggleMetric(metric.id)}
                      />
                      <Label htmlFor={metric.id} className="cursor-pointer text-sm">
                        {metric.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Date Range</Label>
                <Select
                  value={dateRange}
                  onValueChange={(v) => setDateRange(v as "7" | "30" | "90" | "custom")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
                {dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="text-xs">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-2 block">Export Format</Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "csv" | "pdf")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF (Mock)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Schedule (Optional)</Label>
                <div className="space-y-3">
                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={scheduleFrequency}
                      onValueChange={(v) => setScheduleFrequency(v as "none" | "daily" | "weekly" | "monthly")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (One-time)</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground mt-1">
                          Scheduled reports are demo-mode and will append demo events.
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Scheduled reports are simulated and will create demo events in the Live Activity feed.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {scheduleFrequency !== "none" && (
                    <div>
                      <Label>Recipients (comma-separated emails)</Label>
                      <Input
                        value={scheduleRecipients}
                        onChange={(e) => setScheduleRecipients(e.target.value)}
                        placeholder="admin@company.com, manager@company.com"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate}>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {reports.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-3">Recent Reports</div>
            <div className="space-y-2">
              {reports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{report.name}</p>
                      {report.frequency !== "none" && (
                        <Badge variant="outline" className="text-xs">
                          {report.frequency}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {report.lastRun && (
                        <span>
                          Last run: {format(new Date(report.lastRun), "MMM d, yyyy")}
                        </span>
                      )}
                      {report.recipients.length > 0 && (
                        <span>• {report.recipients.length} recipient(s)</span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRunNow(report)}>
                        <Play className="h-3 w-3 mr-2" />
                        Run now
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(report)}>
                        <Download className="h-3 w-3 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(report.id)}>
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
