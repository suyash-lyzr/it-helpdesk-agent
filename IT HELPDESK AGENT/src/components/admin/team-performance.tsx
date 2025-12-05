"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Users, User } from "lucide-react"
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
import { TeamPerformance } from "@/lib/analytics-store"

interface TeamPerformanceProps {
  data: TeamPerformance[]
  onReassign?: (team: string, agent: string) => void
}

function getLoadScoreColor(score: "low" | "medium" | "high"): string {
  switch (score) {
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }
}

function getWorkloadColor(workload: "low" | "medium" | "high"): string {
  switch (workload) {
    case "low":
      return "bg-green-500"
    case "medium":
      return "bg-yellow-500"
    case "high":
      return "bg-red-500"
  }
}

export function TeamPerformanceComponent({ data, onReassign }: TeamPerformanceProps) {
  const [expandedTeams, setExpandedTeams] = React.useState<Set<string>>(new Set())

  const toggleTeam = (team: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(team)) {
      newExpanded.delete(team)
    } else {
      newExpanded.add(team)
    }
    setExpandedTeams(newExpanded)
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
      {data.map((team) => {
        const isExpanded = expandedTeams.has(team.team)

        return (
          <Card key={team.team}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {team.team}
                  </CardTitle>
                  <CardDescription>Team performance metrics</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTeam(team.team)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Queue Size</div>
                    <div className="text-lg font-semibold">{team.queueSize}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Backlog</div>
                    <div className="text-lg font-semibold">{team.backlog}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg First Response</div>
                    <div className="text-lg font-semibold">{team.avgFirstResponse.toFixed(1)}h</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Resolution</div>
                    <div className="text-lg font-semibold">{team.avgResolution.toFixed(1)}h</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Load Score</span>
                  <Badge className={getLoadScoreColor(team.loadScore)}>
                    {team.loadScore.toUpperCase()}
                  </Badge>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-semibold">Agents</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead>Assigned</TableHead>
                          <TableHead>Resolved</TableHead>
                          <TableHead>Handle Time</TableHead>
                          <TableHead>Reopen Rate</TableHead>
                          <TableHead>Workload</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team.agents.map((agent, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{agent.name}</TableCell>
                            <TableCell>{agent.ticketsAssigned}</TableCell>
                            <TableCell>{agent.ticketsResolved}</TableCell>
                            <TableCell>{agent.avgHandleTime.toFixed(1)}h</TableCell>
                            <TableCell>{agent.reopenRate.toFixed(1)}%</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${getWorkloadColor(agent.currentWorkload)}`}
                                />
                                <span className="text-xs capitalize">{agent.currentWorkload}</span>
                              </div>
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
      })}
    </div>
  )
}

