"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import type { TelemetryServer } from "@/lib/telemetry-data";

interface MetricTimeSeriesProps {
  server: TelemetryServer;
}

const chartConfig = {
  cpu: {
    label: "CPU %",
    color: "hsl(0, 84%, 60%)",
  },
  memory: {
    label: "Memory %",
    color: "hsl(221, 83%, 53%)",
  },
  disk: {
    label: "Disk %",
    color: "hsl(142, 71%, 45%)",
  },
} satisfies ChartConfig;

export function MetricTimeSeries({ server }: MetricTimeSeriesProps) {
  const chartData = server.cpuHistory.map((point, i) => ({
    time: format(new Date(point.time), "HH:mm"),
    cpu: point.value,
    memory: server.memoryHistory[i]?.value ?? 0,
    disk: server.diskHistory[i]?.value ?? 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {server.name} — Metrics (Last 60 min)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cpu)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-cpu)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillMemory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-memory)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-memory)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillDisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-disk)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-disk)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              interval={9}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine
              y={85}
              stroke="hsl(0, 84%, 60%)"
              strokeDasharray="4 4"
              label={{ value: "Critical", position: "right", fontSize: 10, fill: "hsl(0, 84%, 60%)" }}
            />
            <Area
              type="monotone"
              dataKey="cpu"
              stroke="var(--color-cpu)"
              fill="url(#fillCpu)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="memory"
              stroke="var(--color-memory)"
              fill="url(#fillMemory)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="disk"
              stroke="var(--color-disk)"
              fill="url(#fillDisk)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
