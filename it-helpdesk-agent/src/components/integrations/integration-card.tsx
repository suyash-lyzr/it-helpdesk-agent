"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
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

// Logo URLs - using publicly available CDN URLs for company logos
const getIntegrationLogo = (providerId: string): string | null => {
  const logos: Record<string, string> = {
    jira: "https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/jira-app-icon.png",
    servicenow:
      "https://logosandtypes.com/wp-content/uploads/2020/12/servicenow.svg",
    okta: "https://logos-world.net/wp-content/uploads/2021/04/Okta-Emblem.png",
    google:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png",
  };

  return logos[providerId] || null;
};

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

  const logoUrl = getIntegrationLogo(integration.meta.id);

  const handleClick = () => {
    // Always navigate to detail page when card is clicked
    router.push(`/integrations/${integration.meta.id}`);
  };

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background border shrink-0 overflow-hidden p-1.5">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${integration.meta.name} logo`}
                width={40}
                height={40}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {integration.meta.name.charAt(0)}
              </span>
            )}
          </div>
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className={
              isConnected
                ? "text-xs bg-green-500 hover:bg-green-600"
                : "text-xs"
            }
          >
            {getStatusLabel()}
          </Badge>
        </div>
        <h3 className="text-sm font-semibold mb-2 line-clamp-1">
          {integration.meta.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-3 flex-1 mb-3">
          {integration.meta.description}
        </p>
        {isConnected && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs mt-auto"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/integrations/${integration.meta.id}`);
            }}
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
