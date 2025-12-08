"use client"

import * as React from "react"
import { format } from "date-fns"
import { Package, User, Calendar, Wrench, ExternalLink, FileText } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Asset } from "@/lib/mock-assets"
import { Ticket } from "@/lib/ticket-types"

interface AssetWidgetProps {
  asset: Asset
  tickets: Ticket[]
  onMarkReplacement?: (assetId: string) => void
  onOpenCMDB?: (assetId: string) => void
  onCreateReplacementTicket?: (assetId: string) => void
}

export function AssetWidget({
  asset,
  tickets,
  onMarkReplacement,
  onOpenCMDB,
  onCreateReplacementTicket,
}: AssetWidgetProps) {
  const assetTickets = tickets.filter((t) => t.asset_id === asset.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Asset Information
        </CardTitle>
        <CardDescription>CMDB correlation and ticket history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Owner</div>
              <div className="flex items-center gap-2 font-medium">
                <User className="h-3 w-3" />
                {asset.owner}
              </div>
              <div className="text-xs text-muted-foreground">{asset.ownerEmail}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Model</div>
              <div className="font-medium">{asset.model}</div>
              <div className="text-xs text-muted-foreground">{asset.manufacturer}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Serial Number</div>
              <div className="font-mono text-xs">{asset.serial}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Asset Tag</div>
              <div className="font-medium">{asset.assetTag}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Warranty End</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(asset.warrantyEnd), "MMM d, yyyy")}</span>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Last Check-in</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(asset.lastCheckin), "MMM d, yyyy HH:mm")}</span>
              </div>
            </div>
            {asset.os && (
              <div>
                <div className="text-muted-foreground mb-1">Operating System</div>
                <div className="font-medium">{asset.os}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground mb-1">Status</div>
              <Badge
                variant={
                  asset.status === "active"
                    ? "default"
                    : asset.status === "pending_replacement"
                    ? "secondary"
                    : "outline"
                }
              >
                {asset.status.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Ticket History</div>
              <Badge variant="outline">{assetTickets.length} tickets</Badge>
            </div>
            {assetTickets.length > 0 ? (
              <div className="space-y-1">
                {assetTickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between text-xs p-2 rounded hover:bg-accent"
                  >
                    <div>
                      <span className="font-mono">{ticket.id}</span>
                      <span className="text-muted-foreground ml-2">
                        {ticket.title.substring(0, 40)}...
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {ticket.status}
                    </Badge>
                  </div>
                ))}
                {assetTickets.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    +{assetTickets.length - 5} more tickets
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No tickets linked to this asset</div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkReplacement?.(asset.id)}
              >
                <Wrench className="h-3 w-3 mr-1" />
                Mark for Replacement
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenCMDB?.(asset.id)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open CMDB
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateReplacementTicket?.(asset.id)}
              >
                <FileText className="h-3 w-3 mr-1" />
                Create Replacement Ticket
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

