"use client";

import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { IntegrationProvider } from "@/lib/integrations-types";

interface SetupGuidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: IntegrationProvider;
  providerName: string;
  onStartQuickConnect: () => void;
}

const SETUP_CHECKLIST: Record<IntegrationProvider, string[]> = {
  jira: [
    "Create a Jira service account user.",
    "Generate API token and paste it in Quick Connect.",
    "Tell us target Project Key.",
    "Optional: Add webhook (copy webhook URL provided in details page).",
  ],
  servicenow: [
    "Create a ServiceNow service account user.",
    "Generate API token and paste it in Quick Connect.",
    "Tell us target Project Key.",
    "Optional: Add webhook (copy webhook URL provided in details page).",
  ],
  okta: [
    "Create an Okta service account user.",
    "Generate API token and paste it in Quick Connect.",
    "Configure provisioning settings.",
    "Optional: Add webhook (copy webhook URL provided in details page).",
  ],
  google: [
    "Create a Google Workspace service account user.",
    "Generate API token and paste it in Quick Connect.",
    "Configure domain-wide delegation.",
    "Optional: Add webhook (copy webhook URL provided in details page).",
  ],
};

export function SetupGuidePanel({
  open,
  onOpenChange,
  provider,
  providerName,
  onStartQuickConnect,
}: SetupGuidePanelProps) {
  const checklist = SETUP_CHECKLIST[provider] || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Setup Guide — {providerName}</SheetTitle>
          <SheetDescription>
            Follow these steps to connect {providerName} to your helpdesk.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              We handle mapping, polling, retries, and audit logs. You only need
              to provide credentials.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Fast path</h3>
            <ul className="space-y-2 text-sm">
              {checklist.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-muted bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Security note:</strong> Tokens are stored encrypted. For
              production use OAuth.
            </p>
          </div>
        </div>

        <SheetFooter className="mt-auto">
          <Button onClick={onStartQuickConnect} className="w-full">
            Start Quick Connect
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
