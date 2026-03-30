"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Server, Database, Globe, Cpu, HardDrive, MemoryStick } from "lucide-react";
import type { TelemetryServer } from "@/lib/telemetry-data";

interface ServerStatusGridProps {
  servers: TelemetryServer[];
  selectedServerId: string | null;
  onServerSelect: (serverId: string) => void;
}

const statusColors: Record<string, string> = {
  healthy: "bg-green-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

const statusBadgeColors: Record<string, string> = {
  healthy:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  critical:
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  server: Server,
  service: Globe,
  database: Database,
};

function MetricBar({ label, value, icon: Icon, warning, critical }: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  warning: number;
  critical: number;
}) {
  const color =
    value >= critical
      ? "bg-red-500"
      : value >= warning
        ? "bg-amber-500"
        : "bg-green-500";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 text-xs">
          <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${color}`}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
          <span className="text-muted-foreground tabular-nums w-8 text-right">
            {value}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {label}: {value}%
      </TooltipContent>
    </Tooltip>
  );
}

export function ServerStatusGrid({
  servers,
  selectedServerId,
  onServerSelect,
}: ServerStatusGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {servers.map((server) => {
        const TypeIcon = typeIcons[server.type] || Server;
        const isSelected = server.id === selectedServerId;

        return (
          <Card
            key={server.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected
                ? "ring-2 ring-primary shadow-md"
                : ""
            }`}
            onClick={() => onServerSelect(server.id)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${statusColors[server.status]}`}
                  />
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold font-mono">
                    {server.name}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${statusBadgeColors[server.status]}`}
                >
                  {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <MetricBar
                  label="CPU"
                  value={server.cpu}
                  icon={Cpu}
                  warning={70}
                  critical={85}
                />
                <MetricBar
                  label="Memory"
                  value={server.memory}
                  icon={MemoryStick}
                  warning={75}
                  critical={85}
                />
                <MetricBar
                  label="Disk"
                  value={server.disk}
                  icon={HardDrive}
                  warning={70}
                  critical={85}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
