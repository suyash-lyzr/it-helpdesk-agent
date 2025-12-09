"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  Bell,
  HelpCircle,
  Info,
  Send,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
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
import { ForecastData } from "@/lib/analytics-store";
import { toast } from "sonner";
import { RequestAccessModal } from "@/components/request-access-modal";

interface ForecastChartProps {
  data: ForecastData[];
  onAnomalyAction?: (anomaly: ForecastData, action: string) => void;
  onNotifyTeam?: (team: string) => void;
  demoMode?: boolean; // Enable demo mode overlay for premium features
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
} satisfies ChartConfig;

function ConfidenceBadge({
  confidence,
}: {
  confidence: "low" | "medium" | "high";
}) {
  const colors = {
    low: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400",
    medium:
      "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400",
    high: "bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-400",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 h-4 ${colors[confidence]}`}
        >
          {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-xs">
          Model confidence — higher means stronger historical evidence.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function ImpactBadge({ impact }: { impact: "low" | "medium" | "high" }) {
  const colors = {
    low: "bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-400",
    medium:
      "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400",
    high: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive",
  };

  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 h-4 ${colors[impact]}`}
    >
      {impact.charAt(0).toUpperCase() + impact.slice(1)}
    </Badge>
  );
}

export function ForecastChart({
  data,
  onAnomalyAction,
  onNotifyTeam,
  demoMode = true,
}: ForecastChartProps) {
  const [isAccessModalOpen, setIsAccessModalOpen] = React.useState(false);
  const [isDemoViewActive, setIsDemoViewActive] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("forecast-chart-demo-view") === "true";
    }
    return false;
  });
  const [showLockedOverlay, setShowLockedOverlay] = React.useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("forecast-chart-demo-view");
      return demoMode && saved !== "true";
    }
    return demoMode;
  });
  const anomalies = data.filter((d) => d.anomalyFlag);

  // Separate forecasted and detected anomalies
  const forecastedAnomalies = anomalies.filter(
    (a) => a.anomalyType === "forecasted" || !a.anomalyType
  );
  const detectedAnomalies = anomalies.filter(
    (a) => a.anomalyType === "detected"
  );

  // Prepare chart data
  const chartData = data.map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    predicted: d.predictedCount,
    confidenceUpper: d.confidenceUpper,
    confidenceLower: d.confidenceLower,
    anomaly: d.anomalyFlag,
  }));

  const handleCreateIncident = (anomaly: ForecastData) => {
    if (isDemoViewActive) {
      return; // Disabled in demo mode
    }
    // Generate demo incident ID
    const incidentId = `INC-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;
    toast.success(`Incident created: ${incidentId} (demo)`);
    onAnomalyAction?.(anomaly, "create_incident");
  };

  const handleNotifyTeam = (team: string, anomaly: ForecastData) => {
    if (isDemoViewActive) {
      return; // Disabled in demo mode
    }
    toast.success(`Notification sent to ${team} team`);
    onNotifyTeam?.(team);
    onAnomalyAction?.(
      anomaly,
      `notify_${team.toLowerCase().replace(/\s+/g, "_")}`
    );
  };

  const handleContinueWithDemo = () => {
    setIsDemoViewActive(true);
    setShowLockedOverlay(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("forecast-chart-demo-view", "true");
    }
  };

  const handleExitDemo = () => {
    setIsDemoViewActive(false);
    setShowLockedOverlay(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("forecast-chart-demo-view", "false");
    }
  };

  return (
    <>
      <Card className="relative overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle>Forecasting & Anomaly Detection</CardTitle>
                {demoMode && !isDemoViewActive && (
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                {isDemoViewActive && (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 flex items-center gap-1.5 px-2 py-0.5 text-xs font-normal"
                  >
                    <span>Demo Mode – Sample Data Only</span>
                    <button
                      onClick={handleExitDemo}
                      className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline text-[10px] font-medium ml-1 transition-colors"
                      type="button"
                    >
                      Exit Demo
                    </button>
                  </Badge>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Predictions may be forecasted (future risk) or detected
                      (observed spike). Reasons explain likely causes and
                      suggested actions.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription className="mt-1">
                7-day ticket volume forecast with confidence bands
              </CardDescription>
            </div>
            {anomalies.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {anomalies.length} Anomaly{anomalies.length > 1 ? "ies" : ""}
                </Badge>
                {forecastedAnomalies.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400"
                  >
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
        <CardContent className="relative">
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="fillConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-confidenceUpper)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-confidenceLower)"
                    stopOpacity={0.1}
                  />
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
                  );
                }
                return null;
              })}
            </AreaChart>
          </ChartContainer>

          {anomalies.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-semibold">Reason / Context</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Why this prediction? The model uses historical ticket
                      trends, scheduled change data, external integration
                      signals (Okta/GWorkspace/Jira/ServiceNow), and recent
                      event spikes to surface likely future risks.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Sort anomalies: detected first, then forecasted, most urgent on top */}
              {[...detectedAnomalies, ...forecastedAnomalies]
                .sort((a, b) => {
                  // Sort by impact (high first), then by date
                  const impactOrder = { high: 3, medium: 2, low: 1 };
                  const aImpact = impactOrder[a.anomalyImpact || "low"];
                  const bImpact = impactOrder[b.anomalyImpact || "low"];
                  if (aImpact !== bImpact) return bImpact - aImpact;
                  return (
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
                })
                .map((anomaly, index) => {
                  const isForecasted =
                    anomaly.anomalyType === "forecasted" ||
                    !anomaly.anomalyType;
                  const isDetected = anomaly.anomalyType === "detected";

                  return (
                    <div
                      key={index}
                      className={`rounded-md border p-3 ${
                        isDetected
                          ? "border-destructive/20 bg-destructive/5 dark:border-destructive/20 dark:bg-destructive/10"
                          : "border-purple-500/20 bg-purple-500/5 dark:border-purple-500/20 dark:bg-purple-500/10"
                      }`}
                    >
                      {/* Header: Badge, Date, Confidence, Impact */}
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge
                            variant={isDetected ? "destructive" : "outline"}
                            className={`text-[10px] px-1.5 py-0 h-4 ${
                              isForecasted
                                ? "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400"
                                : ""
                            }`}
                          >
                            {isForecasted ? "Forecasted" : "Detected"}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(anomaly.date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {anomaly.anomalyConfidence && (
                            <ConfidenceBadge
                              confidence={anomaly.anomalyConfidence}
                            />
                          )}
                          {anomaly.anomalyImpact && (
                            <ImpactBadge impact={anomaly.anomalyImpact} />
                          )}
                        </div>
                      </div>

                      {/* Headline */}
                      <h5 className="font-semibold text-sm mb-2 leading-tight">
                        {anomaly.anomalyHeadline ||
                          anomaly.anomalyReason ||
                          "Anomaly detected"}
                      </h5>

                      {/* Reasons */}
                      {anomaly.anomalyReasons &&
                        anomaly.anomalyReasons.length > 0 && (
                          <ul className="space-y-0.5 mb-2.5 text-xs text-muted-foreground">
                            {anomaly.anomalyReasons.map((reason, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-1.5"
                              >
                                <span className="mt-0.5 text-[10px]">•</span>
                                <span className="leading-relaxed">
                                  {reason}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                      {/* Actions */}
                      {anomaly.anomalyActions &&
                        anomaly.anomalyActions.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2 border-t border-border/50">
                            {anomaly.anomalyActions.map((action, idx) => {
                              const isDisabled = isDemoViewActive;
                              if (action.label === "Create Incident") {
                                return (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant={
                                            action.primary
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          className="text-[11px] h-6 px-2"
                                          onClick={() =>
                                            handleCreateIncident(anomaly)
                                          }
                                          disabled={isDisabled}
                                        >
                                          <Bell className="h-2.5 w-2.5 mr-1" />
                                          {action.label}
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    {isDisabled && (
                                      <TooltipContent>
                                        <p className="text-xs">
                                          Requires premium module
                                        </p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                );
                              } else if (action.label.includes("Notify")) {
                                const teamMatch =
                                  action.label.match(/Notify (.+)/);
                                const team = teamMatch ? teamMatch[1] : "Team";
                                return (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant={
                                            action.primary
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          className="text-[11px] h-6 px-2"
                                          onClick={() =>
                                            handleNotifyTeam(team, anomaly)
                                          }
                                          disabled={isDisabled}
                                        >
                                          <Send className="h-2.5 w-2.5 mr-1" />
                                          {action.label}
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    {isDisabled && (
                                      <TooltipContent>
                                        <p className="text-xs">
                                          Requires premium module
                                        </p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                );
                              }
                              return (
                                <Tooltip key={idx}>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        variant={
                                          action.primary ? "default" : "outline"
                                        }
                                        size="sm"
                                        className="text-[11px] h-6 px-2"
                                        onClick={() =>
                                          !isDisabled &&
                                          onAnomalyAction?.(
                                            anomaly,
                                            action.label
                                              .toLowerCase()
                                              .replace(/\s+/g, "_")
                                          )
                                        }
                                        disabled={isDisabled}
                                      >
                                        {action.label}
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {isDisabled && (
                                    <TooltipContent>
                                      <p className="text-xs">
                                        Requires premium module
                                      </p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              );
                            })}
                          </div>
                        )}

                      {/* Provenance */}
                      {anomaly.anomalyProvenance && (
                        <p className="text-[10px] text-muted-foreground/70 mt-2 leading-tight">
                          {anomaly.anomalyProvenance}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Demo Mode Overlay */}
          {demoMode && showLockedOverlay && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="bg-card border border-border/50 rounded-xl shadow-xl p-8 max-w-lg mx-4">
                <div className="flex flex-col items-center text-center gap-5">
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Premium Feature
                  </Badge>

                  <div className="space-y-3 text-sm text-muted-foreground max-w-md">
                    <p className="leading-relaxed">
                      Real-time ML forecasting and anomaly detection are part of
                      our premium{" "}
                      <strong className="text-foreground font-semibold">
                        IT Operations Intelligence
                      </strong>{" "}
                      module.
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      Contact Lyzr to enable this feature for your organization.
                    </p>
                  </div>

                  <div className="flex gap-3 w-full pt-2">
                    <Button
                      onClick={handleContinueWithDemo}
                      variant="outline"
                      className="flex-1"
                      size="default"
                    >
                      check demo view
                    </Button>
                    <Button
                      onClick={() => setIsAccessModalOpen(true)}
                      className="flex-1"
                      size="default"
                    >
                      Request Access
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Access Modal */}
      <RequestAccessModal
        open={isAccessModalOpen}
        onOpenChange={setIsAccessModalOpen}
        featureName="IT Operations Intelligence - Forecasting & Anomaly Detection"
      />
    </>
  );
}
