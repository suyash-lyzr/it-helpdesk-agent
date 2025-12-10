"use client";

import type React from "react";
import { useAuth } from "@/lib/AuthProvider";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, login } = useAuth();

  // Show loading only while the first auth check is running
  if (!isInitialized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background/80">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show auth screen after initialization confirms user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background/80">
        <div className="max-w-md mx-auto text-center space-y-6 p-8 rounded-2xl border bg-card shadow-sm">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Authentication Required
            </h1>
            <p className="text-muted-foreground">
              Please sign in with your Lyzr Agent Studio account to use the IT
              Helpdesk Agent.
            </p>
          </div>
          <Button onClick={login} size="lg" className="gap-2 w-full">
            <LogIn className="h-4 w-4" />
            Sign In with Lyzr Agent Studio
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
