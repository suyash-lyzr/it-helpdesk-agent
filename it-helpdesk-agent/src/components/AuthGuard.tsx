"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, login } = useAuth();
  const loginTriggered = useRef(false);

  // Automatically trigger SDK login modal when not authenticated
  useEffect(() => {
    // Don't trigger login if there's a token in the URL (let AuthProvider handle it)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");
      if (urlToken) {
        // Token is being processed by AuthProvider, don't trigger SDK login
        return;
      }
    }

    // Add a small delay to ensure token processing is complete
    if (isInitialized && !isAuthenticated && !loginTriggered.current) {
      loginTriggered.current = true;
      // Small delay to ensure token auth has finished processing
      const timeoutId = setTimeout(() => {
        // Trigger login which will show the Lyzr SDK popup
        void login();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isInitialized, isAuthenticated, login]);

  // Show loading while checking auth or waiting for login
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background/80">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
