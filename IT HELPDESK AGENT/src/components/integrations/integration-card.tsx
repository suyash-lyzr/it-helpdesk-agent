"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { IntegrationConfig } from "@/lib/integrations-types";

interface IntegrationCardProps {
  integration: IntegrationConfig;
  demoMode: boolean;
  isAdmin: boolean;
  isBusy: boolean;
  onConnect: (provider: string) => void;
  onDisconnect: (provider: string) => void;
  onTest: (provider: string) => void;
  onCreateDemoTicket?: (provider: string) => void;
  onOpenSetupGuide: (provider: string) => void;
  onOpenConnectModal: (provider: string) => void;
}

export function IntegrationCard({
  integration,
  demoMode,
  isAdmin,
  isBusy,
  onConnect,
  onDisconnect,
  onTest,
  onCreateDemoTicket,
  onOpenSetupGuide,
  onOpenConnectModal,
}: IntegrationCardProps) {
  const router = useRouter();
  const isConnected = integration.status === "connected";

  const getStatusLabel = (): string => {
    if (isConnected && integration.mode === "demo") return "Connected";
    if (isConnected) return "Connected";
    return "Connect";
  };

  const handleClick = () => {
    if (!isAdmin) {
      router.push(`/integrations/${integration.meta.id}`);
      return;
    }
    if (isConnected) {
      onDisconnect(integration.meta.id);
    } else {
      // For JIRA and ServiceNow, navigate to detail page instead of connecting directly
      if (
        integration.meta.id === "jira" ||
        integration.meta.id === "servicenow"
      ) {
        router.push(`/integrations/${integration.meta.id}`);
      } else if (demoMode) {
        onConnect(integration.meta.id);
      } else {
        onOpenConnectModal(integration.meta.id);
      }
    }
  };

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-lg font-semibold shrink-0">
            {integration.meta.name.charAt(0)}
          </div>
          {isConnected ? (
            <Badge
              variant="default"
              className="text-xs bg-green-500 hover:bg-green-600"
            >
              {getStatusLabel()}
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6 px-2"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {getStatusLabel()}
            </Button>
          )}
        </div>
        <h3 className="text-sm font-semibold mb-2 line-clamp-1">
          {integration.meta.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-3 flex-1">
          {integration.meta.description}
        </p>
      </CardContent>
    </Card>
  );
}
