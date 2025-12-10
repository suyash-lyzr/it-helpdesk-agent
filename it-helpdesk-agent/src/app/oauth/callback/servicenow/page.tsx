"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ServiceNowCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(
          error === "redirect_uri_mismatch"
            ? "Redirect URI mismatch. Please copy the redirect URI above into ServiceNow app configuration exactly."
            : `OAuth error: ${decodeURIComponent(error)}`
        );
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("Authorization code is missing");
        return;
      }

      try {
        // Call the exchange endpoint
        const res = await fetch("/api/integrations/servicenow/exchange", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, state }),
        });

        const data = await res.json();

        if (!data.ok) {
          setStatus("error");
          setMessage(data.message || "Failed to exchange authorization code");
          return;
        }

        setStatus("success");
        setMessage(
          "Tokens saved successfully! Return to the integration page and click 'Connect' to activate."
        );

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/integrations/servicenow?tokensSaved=1");
        }, 3000);
      } catch (error) {
        console.error("Exchange error:", error);
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to complete OAuth flow"
        );
      }
    })();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ServiceNow OAuth</CardTitle>
          <CardDescription>Completing authorization...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Exchanging authorization code...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm text-center">{message}</p>
              <p className="text-xs text-muted-foreground">
                Redirecting to integrations page...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <XCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-center text-destructive">{message}</p>
              <Button
                onClick={() => router.push("/integrations/servicenow")}
                variant="outline"
                className="w-full"
              >
                Go to Integrations
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
