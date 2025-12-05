"use client"

import * as React from "react"
import { Bell, Plus, Play, Trash2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

interface AlertRule {
  id: string
  name: string
  condition: string
  action: string
  enabled: boolean
}

const sampleRules: AlertRule[] = [
  {
    id: "1",
    name: "P1 Unresolved Alert",
    condition: "P1 unresolved > 1 hour",
    action: "Alert Slack/Teams",
    enabled: true,
  },
  {
    id: "2",
    name: "Repeat Incident Alert",
    condition: "Repeat incidents from same user",
    action: "Notify manager",
    enabled: true,
  },
]

export function AlertRules() {
  const [rules, setRules] = React.useState<AlertRule[]>(sampleRules)
  const [open, setOpen] = React.useState(false)
  const [ruleName, setRuleName] = React.useState("")
  const [priority, setPriority] = React.useState("")
  const [timeThreshold, setTimeThreshold] = React.useState("")
  const [action, setAction] = React.useState("")

  const handleCreateRule = () => {
    if (!ruleName || !priority || !timeThreshold || !action) {
      toast.error("Please fill all fields")
      return
    }

    const newRule: AlertRule = {
      id: Date.now().toString(),
      name: ruleName,
      condition: `${priority} unresolved > ${timeThreshold} hour(s)`,
      action,
      enabled: true,
    }

    setRules([...rules, newRule])
    toast.success("Alert rule created")
    setOpen(false)
    setRuleName("")
    setPriority("")
    setTimeThreshold("")
    setAction("")
  }

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  const handleSimulate = (rule: AlertRule) => {
    toast.success(`Simulated: ${rule.name} - ${rule.action}`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts & Notification Rules
            </CardTitle>
            <CardDescription>
              Configure automated alerts and notifications
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Alert Rule</DialogTitle>
                <DialogDescription>
                  Set up automated alerts based on ticket conditions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Rule Name</Label>
                  <Input
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="P1 Unresolved Alert"
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1">P1 (High)</SelectItem>
                      <SelectItem value="P2">P2 (Medium)</SelectItem>
                      <SelectItem value="P3">P3 (Low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Threshold (hours)</Label>
                  <Input
                    type="number"
                    value={timeThreshold}
                    onChange={(e) => setTimeThreshold(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>Action</Label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alert Slack/Teams">Alert Slack/Teams</SelectItem>
                      <SelectItem value="Notify manager">Notify manager</SelectItem>
                      <SelectItem value="Escalate to team lead">Escalate to team lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule}>Create Rule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
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
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No alert rules configured
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell className="text-sm">{rule.condition}</TableCell>
                  <TableCell className="text-sm">{rule.action}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Badge variant={rule.enabled ? "default" : "outline"}>
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSimulate(rule)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Simulate
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

