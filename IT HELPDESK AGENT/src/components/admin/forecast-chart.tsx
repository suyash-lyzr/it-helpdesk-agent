"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts"
import { AlertTriangle, Bell } from "lucide-react"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ForecastData } from "@/lib/analytics-store"

interface ForecastChartProps {
  data: ForecastData[]
  onAnomalyAction?: (anomaly: ForecastData) => void
}

const chartConfig = {
  predicted: {
    label: "Predicted",
    color: "hsl(221, 83%, 53%)",
  },
  confidenceUpper: {
    label: "Upper Bound",
    color: "hsl(221, 83%, 53%)",
  },
  confidenceLower: {
    label: "Lower Bound",
    color: "hsl(221, 83%, 53%)",
  },
} satisfies ChartConfig

export function ForecastChart({ data, onAnomalyAction }: ForecastChartProps) {
  const anomalies = data.filter((d) => d.anomalyFlag)

  // Prepare chart data
  const chartData = data.map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    predicted: d.predictedCount,
    confidenceUpper: d.confidenceUpper,
    confidenceLower: d.confidenceLower,
    anomaly: d.anomalyFlag,
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Forecasting & Anomaly Detection</CardTitle>
            <CardDescription>
              7-day ticket volume forecast with confidence bands
              <Badge variant="outline" className="ml-2 text-xs">
                Mocked Prediction
              </Badge>
            </CardDescription>
          </div>
          {anomalies.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {anomalies.length} Anomaly{anomalies.length > 1 ? "ies" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="fillConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-confidenceUpper)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-confidenceLower)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="confidenceUpper"
              stroke="var(--color-confidenceUpper)"
              fill="url(#fillConfidence)"
              strokeWidth={0}
            />
            <Area
              type="monotone"
              dataKey="confidenceLower"
              stroke="var(--color-confidenceLower)"
              fill="url(#fillConfidence)"
              strokeWidth={0}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="var(--color-predicted)"
              fill="none"
              strokeWidth={2}
            />
            {chartData.map((point, index) => {
              if (point.anomaly) {
                return (
                  <ReferenceLine
                    key={index}
                    x={point.date}
                    stroke="red"
                    strokeDasharray="5 5"
                    label={{ value: "Anomaly", position: "top" }}
                  />
                )
              }
              return null
            })}
          </AreaChart>
        </ChartContainer>

        {anomalies.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="text-sm font-semibold">Detected Anomalies:</div>
            {anomalies.map((anomaly, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="font-medium">
                      {format(new Date(anomaly.date), "MMM d, yyyy")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {anomaly.anomalyReason || "Anomaly detected"}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAnomalyAction?.(anomaly)}
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Create Incident
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

