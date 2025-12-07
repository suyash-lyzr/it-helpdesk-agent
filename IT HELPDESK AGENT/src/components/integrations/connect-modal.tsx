"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { IntegrationProvider } from "@/lib/integrations-types";
import {
  connectIntegrationApi,
  testIntegrationApi,
  startJiraOAuth,
} from "@/lib/integrations-api";

interface ConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: IntegrationProvider;
  providerName: string;
  onSuccess: () => void;
}

export function ConnectModal({
  open,
  onOpenChange,
  provider,
  providerName,
  onSuccess,
}: ConnectModalProps) {
  const [activeTab, setActiveTab] = useState<"oauth" | "token">("oauth");
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    token: "",
    project: "",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    token?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleOAuthStart = async () => {
    setLoading(true);
    try {
      if (provider === "jira") {
        const res = await startJiraOAuth();
        if (res.success && res.authorizeUrl) {
          window.location.href = res.authorizeUrl;
        } else {
          toast.error(res.message || "Failed to start OAuth flow");
        }
      } else {
        toast.info("OAuth flow will be implemented for this provider");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to start OAuth flow");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTokenSubmit = async () => {
    const newErrors: { email?: string; token?: string } = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.token) {
      newErrors.token = "API token is required";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await connectIntegrationApi(provider, {
        mode: "real",
        email: formData.email,
        token: formData.token,
        project: formData.project || undefined,
      });

      // Test the connection
      await testIntegrationApi(provider);

      toast.success(`Connected as ${formData.email} — fields auto-discovered.`);
      onSuccess();
      onOpenChange(false);
      setFormData({ email: "", token: "", project: "" });
      setErrors({});
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      toast.error(
        `Connection failed — ${errorMessage}. Check credentials or use OAuth.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFormData({ email: "", token: "", project: "" });
    setErrors({});
    setActiveTab("oauth");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect — {providerName}</DialogTitle>
          <DialogDescription>
            Choose your preferred connection method
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "oauth" | "token")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="oauth">OAuth (recommended)</TabsTrigger>
            <TabsTrigger value="token">Quick token (fast path)</TabsTrigger>
          </TabsList>

          <TabsContent value="oauth" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Recommended production connection using OAuth.
            </p>
            <Button
              onClick={handleOAuthStart}
              disabled={loading}
              className="w-full"
            >
              Start OAuth
            </Button>
          </TabsContent>

          <TabsContent value="token" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Service account email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">API token</Label>
                <div className="relative">
                  <Input
                    id="token"
                    type={showToken ? "text" : "password"}
                    placeholder="Enter API token"
                    value={formData.token}
                    onChange={(e) =>
                      setFormData({ ...formData, token: e.target.value })
                    }
                    aria-invalid={!!errors.token}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                    <span className="sr-only">Toggle token visibility</span>
                  </Button>
                </div>
                {errors.token && (
                  <p className="text-xs text-destructive">{errors.token}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project / Target (optional)</Label>
                <Input
                  id="project"
                  type="text"
                  placeholder="PROJ-123"
                  value={formData.project}
                  onChange={(e) =>
                    setFormData({ ...formData, project: e.target.value })
                  }
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Fast path: provide a service account email and an API token. We
                store tokens encrypted and will auto-discover fields.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {activeTab === "token" && (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleQuickTokenSubmit} disabled={loading}>
                Save & Test
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
