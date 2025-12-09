"use client";

import * as React from "react";
import { Bell, Plus, Play, Trash2, Edit, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { addLiveEvent } from "@/lib/analytics-store";
import { RequestAccessModal } from "@/components/request-access-modal";

interface AlertRule {
  id: string;
  name: string;
  conditionType: string;
  conditionSummary: string;
  threshold?: number;
  thresholdUnit?: string;
  action: string;
  enabled: boolean;
  lastTriggered?: string;
}

const conditionTypes = [
  {
    id: "p1_unresolved",
    label: "P1 unresolved > X hours",
    requiresThreshold: true,
    thresholdUnit: "hours",
  },
  {
    id: "sla_breach",
    label: "SLA breach > X in Y days",
    requiresThreshold: true,
    thresholdUnit: "breaches",
    requiresTimeWindow: true,
    timeWindowUnit: "days",
  },
  {
    id: "access_pending",
    label: "Access approvals pending > X hours",
    requiresThreshold: true,
    thresholdUnit: "hours",
  },
  {
    id: "repeat_incidents",
    label: "Repeat incidents from same user > N times in M days",
    requiresThreshold: true,
    thresholdUnit: "times",
    requiresTimeWindow: true,
    timeWindowUnit: "days",
  },
];

const actionTypes = [
  "Notify Slack/Teams (demo)",
  "Send email to manager (demo)",
  "Create internal ticket (demo)",
  "Send reminder to approver (demo)",
];

// Seed data
const seedRules: AlertRule[] = [
  {
    id: "rule-1",
    name: "P1 Unresolved Alert",
    conditionType: "p1_unresolved",
    conditionSummary: "P1 unresolved > 1 hour",
    threshold: 1,
    thresholdUnit: "hours",
    action: "Notify Slack/Teams (demo)",
    enabled: true,
  },
  {
    id: "rule-2",
    name: "Repeat Incident Alert",
    conditionType: "repeat_incidents",
    conditionSummary: "Repeat incidents from same user > 3 times in 7 days",
    threshold: 3,
    thresholdUnit: "times",
    action: "Create internal ticket (demo)",
    enabled: true,
  },
];

interface AlertRulesProps {
  demoMode?: boolean;
}

const DEMO_STORAGE_KEY = "alert-rules-demo-view";

export function AlertRules({ demoMode = true }: AlertRulesProps = {}) {
  const [rules, setRules] = React.useState<AlertRule[]>(seedRules);
  const [open, setOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<AlertRule | null>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = React.useState(false);
  const [isDemoViewActive, setIsDemoViewActive] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(DEMO_STORAGE_KEY) === "true";
    }
    return false;
  });
  const [ruleName, setRuleName] = React.useState("");
  const [conditionType, setConditionType] = React.useState("");
  const [threshold, setThreshold] = React.useState("");
  const [timeWindow, setTimeWindow] = React.useState("");
  const [action, setAction] = React.useState("");

  const selectedCondition = conditionTypes.find((c) => c.id === conditionType);

  const handleCreateRule = () => {
    if (!ruleName || !conditionType || !action) {
      toast.error("Please fill all required fields");
      return;
    }

    if (selectedCondition?.requiresThreshold && !threshold) {
      toast.error("Please enter threshold value");
      return;
    }

    if (selectedCondition?.requiresTimeWindow && !timeWindow) {
      toast.error("Please enter time window value");
      return;
    }

    const conditionSummary = buildConditionSummary(
      conditionType,
      threshold,
      timeWindow
    );

    const newRule: AlertRule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      name: ruleName,
      conditionType,
      conditionSummary,
      threshold: threshold ? parseInt(threshold) : undefined,
      thresholdUnit: selectedCondition?.thresholdUnit,
      action,
      enabled: true,
    };

    if (editingRule) {
      setRules((prev) =>
        prev.map((r) => (r.id === editingRule.id ? newRule : r))
      );
      toast.success("Alert rule updated (demo)");
    } else {
      setRules((prev) => [newRule, ...prev]);
      addLiveEvent({
        type: "automation_fired",
        actor: "System",
        description: `Alert rule '${ruleName}' created (demo)`,
        headline: `Alert rule '${ruleName}' created (demo)`,
        details: `Condition: ${conditionSummary}, Action: ${action}`,
        category: "automations",
        severity: "low",
      });
      toast.success("Alert rule created (demo)");
    }

    setOpen(false);
    resetForm();
  };

  const buildConditionSummary = (
    type: string,
    thresh?: string,
    timeWin?: string
  ): string => {
    const condition = conditionTypes.find((c) => c.id === type);
    if (!condition) return "";

    if (type === "p1_unresolved") {
      return `P1 unresolved > ${thresh} hour${thresh !== "1" ? "s" : ""}`;
    }
    if (type === "sla_breach") {
      return `SLA breach > ${thresh} in ${timeWin} day${
        timeWin !== "1" ? "s" : ""
      }`;
    }
    if (type === "access_pending") {
      return `Access approvals pending > ${thresh} hour${
        thresh !== "1" ? "s" : ""
      }`;
    }
    if (type === "repeat_incidents") {
      return `Repeat incidents from same user > ${thresh} time${
        thresh !== "1" ? "s" : ""
      } in ${timeWin} day${timeWin !== "1" ? "s" : ""}`;
    }
    return condition.label;
  };

  const resetForm = () => {
    setRuleName("");
    setConditionType("");
    setThreshold("");
    setTimeWindow("");
    setAction("");
    setEditingRule(null);
  };

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const handleRunNow = (rule: AlertRule) => {
    if (!rule.enabled) {
      toast.error("Rule is disabled. Enable it first.");
      return;
    }

    const ticketId = rule.action.includes("ticket")
      ? `TKT-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`
      : undefined;

    addLiveEvent({
      type: "automation_fired",
      actor: "System",
      description: `Rule '${rule.name}' triggered — ${rule.action}`,
      headline: `Rule '${rule.name}' triggered — ${rule.action}`,
      details: `Condition: ${rule.conditionSummary}`,
      category: "automations",
      severity: "medium",
      ticketId,
      externalId: ticketId,
    });

    setRules((prev) =>
      prev.map((r) =>
        r.id === rule.id ? { ...r, lastTriggered: new Date().toISOString() } : r
      )
    );

    if (ticketId) {
      toast.success(`Rule triggered — Ticket ${ticketId} created (demo)`);
    } else {
      toast.success(`Rule '${rule.name}' triggered (demo)`);
    }
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setConditionType(rule.conditionType);
    setThreshold(rule.threshold?.toString() || "");
    setTimeWindow(
      rule.conditionSummary.includes("in")
        ? rule.conditionSummary.match(/in (\d+)/)?.[1] || ""
        : ""
    );
    setAction(rule.action);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success("Alert rule deleted (demo)");
  };

  const handleExitDemo = () => {
    setIsDemoViewActive(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(DEMO_STORAGE_KEY, "false");
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="space-y-3">
        {/* Top row: Demo mode tag on the right */}
        <div className="flex justify-end">
          {demoMode && !isDemoViewActive && (
            <Badge
              variant="outline"
              className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 text-xs font-normal cursor-pointer hover:bg-blue-500/30 transition-colors"
              onClick={() => setIsAccessModalOpen(true)}
            >
              Demo Mode – Request Access to Unlock
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
        </div>

        {/* Second row: Heading and Create Rule button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <CardTitle>Alerts & Notification Rules</CardTitle>
          </div>
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Edit Alert Rule" : "Create Alert Rule"}
                </DialogTitle>
                <DialogDescription>
                  Set up automated alerts based on ticket conditions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="P1 Unresolved Alert"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Trigger/Condition</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Select
                        value={conditionType}
                        onValueChange={setConditionType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionTypes.map((condition) => (
                            <SelectItem key={condition.id} value={condition.id}>
                              {condition.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Select a simple condition. Complex rules can be added
                        later.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  {selectedCondition?.requiresThreshold && (
                    <div className="mt-2">
                      <Label htmlFor="threshold" className="text-xs">
                        Threshold ({selectedCondition.thresholdUnit})
                      </Label>
                      <Input
                        id="threshold"
                        type="number"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                  )}
                  {selectedCondition?.requiresTimeWindow && (
                    <div className="mt-2">
                      <Label htmlFor="time-window" className="text-xs">
                        Time Window ({selectedCondition.timeWindowUnit})
                      </Label>
                      <Input
                        id="time-window"
                        type="number"
                        value={timeWindow}
                        onChange={(e) => setTimeWindow(e.target.value)}
                        placeholder="7"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block">Action</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Select value={action} onValueChange={setAction}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map((actionType) => (
                            <SelectItem key={actionType} value={actionType}>
                              {actionType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Demo actions are simulated and will append events to
                        Live Activity.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateRule}>
                  {editingRule ? "Update Rule" : "Create Rule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Third row: Description */}
        <CardDescription>
          Create simple alert rules to notify teams or run demo actions when
          conditions are met.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        {rules.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alert rules configured</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{rule.name}</span>
                      {rule.lastTriggered && (
                        <Badge
                          variant="outline"
                          className="text-[10px] w-fit bg-orange-500/10 text-orange-700 border-orange-500/20"
                        >
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                          Triggered{" "}
                          {formatDistanceToNow(new Date(rule.lastTriggered), {
                            addSuffix: true,
                          })}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {rule.conditionSummary}
                  </TableCell>
                  <TableCell className="text-sm">{rule.action}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                        aria-label={`Toggle ${rule.name}`}
                      />
                      <Badge
                        variant={rule.enabled ? "default" : "outline"}
                        className="text-xs"
                      >
                        {rule.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRunNow(rule)}
                            disabled={!rule.enabled}
                            aria-label={`Run ${rule.name} now`}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Run now</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEdit(rule)}
                            aria-label={`Edit ${rule.name}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Edit</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDelete(rule.id)}
                            aria-label={`Delete ${rule.name}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Delete</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Request Access Modal */}
      <RequestAccessModal
        open={isAccessModalOpen}
        onOpenChange={setIsAccessModalOpen}
        featureName="Enterprise Automation Suite - Alerts & Notification Rules"
      />
    </Card>
  );
}
