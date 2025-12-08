"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Calendar, X, Filter } from "lucide-react"
import { format, subDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AnalyticsFiltersProps {
  onFiltersChange?: (filters: FilterState) => void
}

export interface FilterState {
  startDate?: string
  endDate?: string
  team?: string
  priority?: string
  category?: string
  assignee?: string
  slaStatus?: string
  source?: string
}

export function AnalyticsFilters({ onFiltersChange }: AnalyticsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = React.useState<FilterState>({
    startDate: searchParams.get("start_date") || format(subDays(new Date(), 7), "yyyy-MM-dd"),
    endDate: searchParams.get("end_date") || format(new Date(), "yyyy-MM-dd"),
    team: searchParams.get("team") || "all",
    priority: searchParams.get("priority") || "all",
    category: searchParams.get("category") || "all",
    assignee: searchParams.get("assignee") || "all",
    slaStatus: searchParams.get("sla_status") || "all",
    source: searchParams.get("source") || "all",
  })

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)

    // Update URL
    const params = new URLSearchParams()
    Object.entries(updated).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value)
      }
    })
    router.push(`?${params.toString()}`, { scroll: false })

    onFiltersChange?.(updated)
  }

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      team: "all",
      priority: "all",
      category: "all",
      assignee: "all",
      slaStatus: "all",
      source: "all",
    }
    setFilters(defaultFilters)
    router.push("?", { scroll: false })
    onFiltersChange?.(defaultFilters)
  }

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "all"
  ).length

  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-semibold">Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-medium">Date Range</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => updateFilters({ startDate: e.target.value })}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => updateFilters({ endDate: e.target.value })}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Team</Label>
              <Select
                value={filters.team}
                onValueChange={(v) => updateFilters({ team: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="Network">Network</SelectItem>
                  <SelectItem value="Endpoint Support">Endpoint Support</SelectItem>
                  <SelectItem value="Application Support">Application Support</SelectItem>
                  <SelectItem value="IAM">IAM</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={(v) => updateFilters({ priority: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(v) => updateFilters({ category: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="access_request">Access Request</SelectItem>
                  <SelectItem value="request">Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Assignee</Label>
              <Select
                value={filters.assignee}
                onValueChange={(v) => updateFilters({ assignee: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="John Doe">John Doe</SelectItem>
                  <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                  <SelectItem value="Bob Johnson">Bob Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">SLA Status</Label>
              <Select
                value={filters.slaStatus}
                onValueChange={(v) => updateFilters({ slaStatus: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="meeting">Meeting SLA</SelectItem>
                  <SelectItem value="breached">Breached</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Source</Label>
              <Select
                value={filters.source}
                onValueChange={(v) => updateFilters({ source: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

