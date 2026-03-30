"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Search,
  AlertTriangle,
  Brain,
  Ticket,
  Loader2,
} from "lucide-react";
import type { AgentAction } from "@/lib/telemetry-data";

interface AIAgentLogProps {
  actions: AgentAction[];
  isScanning: boolean;
}

const actionConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    borderColor: string;
    badgeClass: string;
    label: string;
  }
> = {
  scan: {
    icon: Search,
    borderColor: "border-l-blue-400",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    label: "Scan",
  },
  detect: {
    icon: AlertTriangle,
    borderColor: "border-l-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    label: "Detect",
  },
  analyze: {
    icon: Brain,
    borderColor: "border-l-purple-500",
    badgeClass:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
    label: "Analyze",
  },
  create_ticket: {
    icon: Ticket,
    borderColor: "border-l-green-500",
    badgeClass:
      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    label: "Ticket",
  },
};

export function AIAgentLog({ actions, isScanning }: AIAgentLogProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">AI Agent Monitor</CardTitle>
          </div>
          {isScanning && (
            <Badge variant="outline" className="gap-1 text-xs animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              Monitoring
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <ScrollArea className="h-[420px] w-full pr-3">
          <div className="space-y-2">
            {actions.map((action) => {
              const config = actionConfig[action.type] || actionConfig.scan;
              const Icon = config.icon;

              return (
                <div
                  key={action.id}
                  className={`border-l-[3px] ${config.borderColor} rounded-r-md bg-muted/30 p-3 space-y-1`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${config.badgeClass}`}
                      >
                        {config.label}
                      </Badge>
                      {action.serverName && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {action.serverName}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {format(new Date(action.timestamp), "HH:mm:ss")}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{action.message}</p>
                  {action.details && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                      {action.details}
                    </p>
                  )}
                  {action.ticketId && (
                    <a
                      href="/tickets"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                    >
                      <Ticket className="h-3 w-3" />
                      {action.ticketId}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
