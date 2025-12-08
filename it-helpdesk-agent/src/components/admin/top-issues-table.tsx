"use client"

import * as React from "react"
import { ArrowUpRight, ArrowDownRight, ExternalLink, FileText } from "lucide-react"
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
import { TopIssue } from "@/lib/analytics-store"

interface TopIssuesTableProps {
  issues: TopIssue[]
  onTicketClick?: (ticketId: string) => void
  onOpenRelated?: (issue: TopIssue) => void
  onCreateExternal?: (issue: TopIssue) => void
}

export function TopIssuesTable({
  issues,
  onTicketClick,
  onOpenRelated,
  onCreateExternal,
}: TopIssuesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Issues / Root-Cause Analysis</CardTitle>
        <CardDescription>
          Recurring issues grouped by similarity with trend analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead>Sample Tickets</TableHead>
              <TableHead>KB Article</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No recurring issues found
                </TableCell>
              </TableRow>
            ) : (
              issues.map((issue, index) => {
                const isPositive = issue.trend >= 0
                const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight
                const trendColor = isPositive ? "text-red-600" : "text-green-600"

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium max-w-md">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {issue.category}
                        </Badge>
                        <span className="line-clamp-2">{issue.issue}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{issue.count}</span>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${trendColor}`}>
                        <TrendIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {Math.abs(issue.trend).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {issue.sampleTicketIds.slice(0, 3).map((ticketId) => (
                          <Button
                            key={ticketId}
                            variant="link"
                            className="h-auto p-0 text-xs text-primary hover:underline"
                            onClick={() => onTicketClick?.(ticketId)}
                          >
                            {ticketId.substring(0, 12)}...
                          </Button>
                        ))}
                        {issue.sampleTicketIds.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{issue.sampleTicketIds.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {issue.suggestedKBArticle ? (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {issue.suggestedKBArticle}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenRelated?.(issue)}
                        >
                          Open Related
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCreateExternal?.(issue)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Create Incident
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

