"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Clock, Users, Bell, AlertCircle } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface AccessRequestAnalyticsProps {
  pending: number
  avgApprovalTime: number
  volumeByApp: Record<string, number>
  requestsByManager: Array<{ manager: string; count: number }>
  onSendReminder?: (manager: string) => void
}

const pieChartConfig = {
  okta: {
    label: "Okta",
    color: "hsl(221, 83%, 53%)",
  },
  google: {
    label: "Google Workspace",
    color: "hsl(142, 76%, 36%)",
  },
  other: {
    label: "Other",
    color: "hsl(0, 0%, 50%)",
  },
} satisfies ChartConfig

const barChartConfig = {
  count: {
    label: "Requests",
    color: "hsl(221, 83%, 53%)",
  },
} satisfies ChartConfig

export function AccessRequestAnalytics({
  pending,
  avgApprovalTime,
  volumeByApp,
  requestsByManager,
  onSendReminder,
}: AccessRequestAnalyticsProps) {
  const pieData = Object.entries(volumeByApp).map(([name, value]) => ({
    name: name === "Google Workspace" ? "google" : name.toLowerCase(),
    value,
  }))

  const stalledManagers = requestsByManager.filter((m) => m.count > 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Access Request Analytics
        </CardTitle>
        <CardDescription>
          Access request metrics and approval tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground mb-1">Pending Approvals</div>
                <div className="text-2xl font-bold">{pending}</div>
                {pending > 10 && (
                  <Badge variant="destructive" className="mt-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    High
                  </Badge>
                )}
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground mb-1">Avg Approval Time</div>
                <div className="text-2xl font-bold">{avgApprovalTime.toFixed(1)}h</div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last 30 days
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Volume by Application</div>
              <ChartContainer config={pieChartConfig} className="h-[200px] w-full">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`var(--color-${entry.name})`}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold mb-2">Requests by Manager</div>
              <ChartContainer config={barChartConfig} className="h-[200px] w-full">
                <BarChart data={requestsByManager}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="manager" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" />
                </BarChart>
              </ChartContainer>
            </div>

            {stalledManagers.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Stalled Approvals
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manager</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stalledManagers.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.manager}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.count} requests</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSendReminder?.(item.manager)}
                          >
                            <Bell className="h-3 w-3 mr-1" />
                            Send Reminder
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

