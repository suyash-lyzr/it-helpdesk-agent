"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts"
import { AlertTriangle, Bell, HelpCircle, Info, Send } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ForecastData } from "@/lib/analytics-store"
import { toast } from "sonner"

interface ForecastChartProps {
  data: ForecastData[]
  onAnomalyAction?: (anomaly: ForecastData, action: string) => void
  onNotifyTeam?: (team: string) => void
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

function ConfidenceBadge({ confidence }: { confidence: "low" | "medium" | "high" }) {
  const colors = {
    low: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400",
    medium: "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400",
    high: "bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-400",
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${colors[confidence]}`}>
          {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-xs">Model confidence — higher means stronger historical evidence.</p>
      </TooltipContent>
    </Tooltip>
  )
}

function ImpactBadge({ impact }: { impact: "low" | "medium" | "high" }) {
  const colors = {
    low: "bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-400",
    medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400",
    high: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive",
  }

  return (
    <Badge variant="outline" className={`text-xs px-2 py-0.5 ${colors[impact]}`}>
      {impact.charAt(0).toUpperCase() + impact.slice(1)} Impact
    </Badge>
  )
}

export function ForecastChart({ data, onAnomalyAction, onNotifyTeam }: ForecastChartProps) {
  const anomalies = data.filter((d) => d.anomalyFlag)

  // Separate forecasted and detected anomalies
  const forecastedAnomalies = anomalies.filter((a) => a.anomalyType === "forecasted" || !a.anomalyType)
  const detectedAnomalies = anomalies.filter((a) => a.anomalyType === "detected")

  // Prepare chart data
  const chartData = data.map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    predicted: d.predictedCount,
    confidenceUpper: d.confidenceUpper,
    confidenceLower: d.confidenceLower,
    anomaly: d.anomalyFlag,
  }))

  const handleCreateIncident = (anomaly: ForecastData) => {
    // Generate demo incident ID
    const incidentId = `INC-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`
    toast.success(`Incident created: ${incidentId} (demo)`)
    onAnomalyAction?.(anomaly, "create_incident")
  }

  const handleNotifyTeam = (team: string, anomaly: ForecastData) => {
    toast.success(`Notification sent to ${team} team`)
    onNotifyTeam?.(team)
    onAnomalyAction?.(anomaly, `notify_${team.toLowerCase().replace(/\s+/g, "_")}`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>Forecasting & Anomaly Detection</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Predictions may be forecasted (future risk) or detected (observed spike). Reasons explain likely causes and suggested actions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <CardDescription className="mt-1">
              7-day ticket volume forecast with confidence bands
              <Badge variant="outline" className="ml-2 text-xs">
                Mocked Prediction
              </Badge>
            </CardDescription>
          </div>
          {anomalies.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {anomalies.length} Anomaly{anomalies.length > 1 ? "ies" : ""}
              </Badge>
              {forecastedAnomalies.length > 0 && (
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400">
                  {forecastedAnomalies.length} Forecasted
                </Badge>
              )}
              {detectedAnomalies.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {detectedAnomalies.length} Detected
                </Badge>
              )}
            </div>
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
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">Reason / Context</h4>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Why this prediction? The model uses historical ticket trends, scheduled change data, external integration signals (Okta/GWorkspace/Jira/ServiceNow), and recent event spikes to surface likely future risks.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Sort anomalies: detected first, then forecasted, most urgent on top */}
            {[...detectedAnomalies, ...forecastedAnomalies]
              .sort((a, b) => {
                // Sort by impact (high first), then by date
                const impactOrder = { high: 3, medium: 2, low: 1 }
                const aImpact = impactOrder[a.anomalyImpact || "low"]
                const bImpact = impactOrder[b.anomalyImpact || "low"]
                if (aImpact !== bImpact) return bImpact - aImpact
                return new Date(b.date).getTime() - new Date(a.date).getTime()
              })
              .map((anomaly, index) => {
                const isForecasted = anomaly.anomalyType === "forecasted" || !anomaly.anomalyType
                const isDetected = anomaly.anomalyType === "detected"

                return (
                  <div
                    key={index}
                    className={`rounded-lg border p-4 ${
                      isDetected
                        ? "border-destructive/30 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10"
                        : "border-purple-500/30 bg-purple-500/5 dark:border-purple-500/30 dark:bg-purple-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={isDetected ? "destructive" : "outline"}
                            className={`text-xs ${
                              isForecasted
                                ? "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400"
                                : ""
                            }`}
                          >
                            {isForecasted ? "Forecasted" : "Detected"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(anomaly.date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <h5 className="font-semibold text-sm mt-1">
                          {anomaly.anomalyHeadline || anomaly.anomalyReason || "Anomaly detected"}
                        </h5>
                      </div>
                      <div className="flex items-center gap-2">
                        {anomaly.anomalyConfidence && (
                          <ConfidenceBadge confidence={anomaly.anomalyConfidence} />
                        )}
                        {anomaly.anomalyImpact && (
                          <ImpactBadge impact={anomaly.anomalyImpact} />
                        )}
                      </div>
                    </div>

                    {anomaly.anomalyReasons && anomaly.anomalyReasons.length > 0 && (
                      <ul className="space-y-1 mb-3 text-xs text-muted-foreground">
                        {anomaly.anomalyReasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {anomaly.anomalyActions && anomaly.anomalyActions.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        {anomaly.anomalyActions.map((action, idx) => {
                          if (action.label === "Create Incident") {
                            return (
                              <Button
                                key={idx}
                                variant={action.primary ? "default" : "outline"}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handleCreateIncident(anomaly)}
                              >
                                <Bell className="h-3 w-3 mr-1" />
                                {action.label}
                              </Button>
                            )
                          } else if (action.label.includes("Notify")) {
                            const teamMatch = action.label.match(/Notify (.+)/)
                            const team = teamMatch ? teamMatch[1] : "Team"
                            return (
                              <Button
                                key={idx}
                                variant={action.primary ? "default" : "outline"}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handleNotifyTeam(team, anomaly)}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                {action.label}
                              </Button>
                            )
                          }
                          return (
                            <Button
                              key={idx}
                              variant={action.primary ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => onAnomalyAction?.(anomaly, action.label.toLowerCase().replace(/\s+/g, "_"))}
                            >
                              {action.label}
                            </Button>
                          )
                        })}
                      </div>
                    )}

                    {anomaly.anomalyProvenance && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {anomaly.anomalyProvenance}
                      </p>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
