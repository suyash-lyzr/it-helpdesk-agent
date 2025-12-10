"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface ServiceNowCredentialsFormProps {
  onSaveSuccess?: () => void;
  isAdmin?: boolean;
}

export function ServiceNowCredentialsForm({
  onSaveSuccess,
  isAdmin = true,
}: ServiceNowCredentialsFormProps) {
  const [grantType, setGrantType] = useState<
    "authorization_code" | "client_credentials"
  >("authorization_code");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [startingOAuth, setStartingOAuth] = useState(false);
  const [savedState, setSavedState] = useState<{
    instance: string | null;
    clientId: string | null;
    grantType: string | null;
    connected: boolean;
    hasTokens?: boolean;
  } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [errors, setErrors] = useState<{
    instance?: string;
    clientId?: string;
    clientSecret?: string;
  }>({});

  // Get base URL for redirect URI
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  };

  const redirectUri = `${getBaseUrl()}/oauth/callback/servicenow`;
  const prodRedirectUri = `https://it-helpdesk.lyzr.app/oauth/callback/servicenow`;

  // Fetch saved state on mount
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/integrations/servicenow/state");
        const data = await res.json();
        setSavedState(data);
        if (data.instance) {
          setInstanceUrl(data.instance);
        }
        if (data.clientId) {
          setClientId(data.clientId);
        }
        if (data.grantType) {
          setGrantType(
            data.grantType as "authorization_code" | "client_credentials"
          );
        }
      } catch (error) {
        console.error("Failed to fetch state:", error);
      }
    })();
  }, []);

  const validateInstanceUrl = (url: string): string | undefined => {
    if (!url) {
      return "Instance URL is required";
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") {
        return "Instance URL must use HTTPS";
      }
      if (!parsed.hostname.includes(".service-now.com")) {
        return "Instance URL must contain .service-now.com";
      }
    } catch {
      return "Invalid URL format";
    }
    return undefined;
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};

    const instanceError = validateInstanceUrl(instanceUrl);
    if (instanceError) {
      newErrors.instance = instanceError;
    }

    if (!clientId) {
      newErrors.clientId = "Client ID is required";
    }

    if (grantType === "client_credentials" && !clientSecret) {
      newErrors.clientSecret =
        "Client Secret is required for Client Credentials grant type";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/integrations/servicenow/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instance: instanceUrl,
          clientId,
          clientSecret: clientSecret || undefined,
          grantType,
          redirectUri,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        toast.error(data.message || "Failed to save credentials");
        return;
      }

      toast.success("Credentials saved successfully");
      setSavedState({
        instance: instanceUrl,
        clientId,
        grantType,
        connected: savedState?.connected || false,
      });
      onSaveSuccess?.();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const handleStartOAuth = async () => {
    if (!savedState?.instance || !savedState?.clientId) {
      toast.error("Please save credentials first");
      return;
    }

    setStartingOAuth(true);
    try {
      if (grantType === "authorization_code") {
        const res = await fetch("/api/integrations/servicenow/start-oauth", {
          method: "POST",
        });

        const data = await res.json();

        if (!data.ok || !data.authorizeUrl) {
          toast.error(data.message || "Failed to start OAuth");
          return;
        }

        // Redirect to ServiceNow OAuth page
        window.location.href = data.authorizeUrl;
      } else {
        // Client credentials - get token directly
        const res = await fetch("/api/integrations/servicenow/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grantType: "client_credentials",
          }),
        });

        const data = await res.json();

        if (!data.ok) {
          toast.error(data.message || "Failed to get token");
          return;
        }

        toast.success(
          "Tokens saved successfully! Click 'Connect' to activate the integration."
        );
        // Refresh state to show hasTokens
        const stateRes = await fetch("/api/integrations/servicenow/state");
        const stateData = await stateRes.json();
        setSavedState(stateData);
        onSaveSuccess?.();
      }
    } catch (error) {
      console.error("OAuth start error:", error);
      toast.error("Failed to start OAuth");
    } finally {
      setStartingOAuth(false);
    }
  };

  const handleConnect = async () => {
    if (!savedState?.hasTokens) {
      toast.error("Please complete OAuth setup first to get tokens");
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch("/api/integrations/servicenow/connect", {
        method: "POST",
      });

      const data = await res.json();

      if (!data.ok) {
        toast.error(data.message || "Failed to connect");
        return;
      }

      toast.success("ServiceNow integration connected successfully!");
      // Refresh state
      const stateRes = await fetch("/api/integrations/servicenow/state");
      const stateData = await stateRes.json();
      setSavedState(stateData);
      onSaveSuccess?.();
    } catch (error) {
      console.error("Connect error:", error);
      toast.error("Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/integrations/servicenow/test", {
        method: "POST",
      });

      const data = await res.json();

      if (data.ok || data.success) {
        toast.success(data.msg || data.message || "Connection test successful");
      } else {
        toast.error(data.message || "Connection test failed");
      }
    } catch (error) {
      console.error("Test error:", error);
      toast.error("Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  const copyRedirectUri = (uri: string) => {
    navigator.clipboard.writeText(uri);
    toast.success("Redirect URI copied to clipboard");
  };

  const canStartOAuth = savedState?.instance && savedState?.clientId && !saving;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">ServiceNow Credentials</h3>
          {savedState?.instance && (
            <Badge variant={savedState.connected ? "default" : "secondary"}>
              {savedState.connected ? "Connected" : "Saved"}
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grant-type">Grant Type</Label>
            <Select
              value={grantType}
              onValueChange={(value) =>
                setGrantType(
                  value as "authorization_code" | "client_credentials"
                )
              }
            >
              <SelectTrigger id="grant-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="authorization_code">
                  Authorization Code (interactive)
                </SelectItem>
                <SelectItem value="client_credentials">
                  Client Credentials (machine-to-machine)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instance-url">SN_INSTANCE_URL</Label>
            <Input
              id="instance-url"
              type="url"
              placeholder="https://your-instance.service-now.com"
              value={instanceUrl}
              onChange={(e) => {
                setInstanceUrl(e.target.value);
                if (errors.instance) {
                  setErrors({ ...errors, instance: undefined });
                }
              }}
              disabled={saving}
              aria-invalid={!!errors.instance}
            />
            {errors.instance && (
              <p className="text-xs text-destructive">{errors.instance}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Your ServiceNow instance URL (must contain .service-now.com)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-id">SN_CLIENT_ID</Label>
            <Input
              id="client-id"
              type="text"
              placeholder="Enter Client ID"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                if (errors.clientId) {
                  setErrors({ ...errors, clientId: undefined });
                }
              }}
              disabled={saving}
              aria-invalid={!!errors.clientId}
            />
            {errors.clientId && (
              <p className="text-xs text-destructive">{errors.clientId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-secret">SN_CLIENT_SECRET</Label>
            <div className="relative">
              <Input
                id="client-secret"
                type={showSecret ? "text" : "password"}
                placeholder={
                  grantType === "client_credentials"
                    ? "Enter Client Secret (required)"
                    : "Enter Client Secret (optional for auth code)"
                }
                value={clientSecret}
                onChange={(e) => {
                  setClientSecret(e.target.value);
                  if (errors.clientSecret) {
                    setErrors({ ...errors, clientSecret: undefined });
                  }
                }}
                disabled={saving}
                aria-invalid={!!errors.clientSecret}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.clientSecret && (
              <p className="text-xs text-destructive">{errors.clientSecret}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {grantType === "client_credentials"
                ? "Required for Client Credentials grant type"
                : "Optional to start auth, but required before token exchange"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Redirect URI</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={redirectUri}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyRedirectUri(redirectUri)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy this exact URI to your ServiceNow OAuth app configuration
              </p>
              {redirectUri.includes("localhost") && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <p className="font-semibold mb-1">Production Redirect URI:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 bg-background rounded">
                      {prodRedirectUri}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyRedirectUri(prodRedirectUri)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || !isAdmin}
          variant="default"
        >
          {saving ? "Saving..." : "Save Credentials"}
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={handleStartOAuth}
                  disabled={!canStartOAuth || startingOAuth || !isAdmin}
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {startingOAuth
                    ? "Starting..."
                    : grantType === "authorization_code"
                    ? "Start OAuth Setup"
                    : "Get Token"}
                </Button>
              </span>
            </TooltipTrigger>
            {!canStartOAuth && (
              <TooltipContent>
                <p>Enter and Save Instance + Client credentials first.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {savedState?.hasTokens && !savedState?.connected && (
          <Button
            onClick={handleConnect}
            disabled={connecting || !isAdmin}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {connecting ? "Connecting..." : "Connect"}
          </Button>
        )}

        <Button
          onClick={handleTest}
          disabled={testing || !isAdmin || !savedState?.connected}
          variant="secondary"
        >
          {testing ? "Testing..." : "Test Connection"}
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Status:{" "}
          <Badge variant={savedState?.instance ? "default" : "secondary"}>
            {savedState?.instance ? "Saved" : "Not saved"}
          </Badge>
        </span>
        <span>
          Integration:{" "}
          <Badge variant={savedState?.connected ? "default" : "secondary"}>
            {savedState?.connected ? "Connected" : "Not connected"}
          </Badge>
        </span>
      </div>
    </div>
  );
}
