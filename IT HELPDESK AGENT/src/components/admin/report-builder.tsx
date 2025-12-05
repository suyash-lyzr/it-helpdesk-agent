"use client"

import * as React from "react"
import { Download, FileText, X } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

interface ReportBuilderProps {
  onGenerateReport?: (config: ReportConfig) => void
  scheduledReports?: ScheduledReport[]
}

interface ReportConfig {
  metrics: string[]
  format: "csv" | "pdf"
  dateRange?: { start: string; end: string }
  filters?: Record<string, unknown>
  schedule?: {
    name: string
    frequency: "daily" | "weekly" | "monthly"
    recipients: string[]
  }
}

interface ScheduledReport {
  id: string
  name: string
  frequency: string
  recipients: string[]
  createdAt: string
  lastRun?: string
}

const availableMetrics = [
  { id: "kpis", label: "KPI Metrics" },
  { id: "sla_funnel", label: "SLA Funnel" },
  { id: "top_issues", label: "Top Issues" },
  { id: "team_performance", label: "Team Performance" },
]

export function ReportBuilder({ onGenerateReport, scheduledReports = [] }: ReportBuilderProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedMetrics, setSelectedMetrics] = React.useState<string[]>([])
  const [format, setFormat] = React.useState<"csv" | "pdf">("csv")
  const [scheduleName, setScheduleName] = React.useState("")
  const [scheduleFrequency, setScheduleFrequency] = React.useState<"daily" | "weekly" | "monthly">("weekly")
  const [scheduleRecipients, setScheduleRecipients] = React.useState("")

  const handleGenerate = () => {
    if (selectedMetrics.length === 0) {
      toast.error("Please select at least one metric")
      return
    }

    const config: ReportConfig = {
      metrics: selectedMetrics,
      format,
    }

    if (scheduleName) {
      config.schedule = {
        name: scheduleName,
        frequency: scheduleFrequency,
        recipients: scheduleRecipients.split(",").map((e) => e.trim()).filter(Boolean),
      }
    }

    onGenerateReport?.(config)
    toast.success(`Report generated as ${format.toUpperCase()}`)
    setOpen(false)
  }

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId)
        ? prev.filter((id) => id !== metricId)
        : [...prev, metricId]
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Report Builder & Export
        </CardTitle>
        <CardDescription>
          Generate custom reports and schedule automated exports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Build Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Build Custom Report</DialogTitle>
                <DialogDescription>
                  Select metrics and configure export settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
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
                        <Label htmlFor={metric.id} className="cursor-pointer">
                          {metric.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Export Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as "csv" | "pdf")}>
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
                  <Label className="mb-3 block">Schedule Report (Optional)</Label>
                  <div className="space-y-3">
                    <div>
                      <Label>Report Name</Label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Weekly SLA Report"
                        value={scheduleName}
                        onChange={(e) => setScheduleName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Select
                        value={scheduleFrequency}
                        onValueChange={(v) => setScheduleFrequency(v as "daily" | "weekly" | "monthly")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Recipients (comma-separated emails)</Label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="admin@company.com, manager@company.com"
                        value={scheduleRecipients}
                        onChange={(e) => setScheduleRecipients(e.target.value)}
                      />
                    </div>
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

          {scheduledReports.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-3">Scheduled Reports</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.frequency}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {report.recipients.length} recipient(s)
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report.lastRun
                          ? new Date(report.lastRun).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <X className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

