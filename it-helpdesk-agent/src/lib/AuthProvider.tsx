"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

export interface TokenData {
  _id: string;
  api_key: string;
  user_id: string;
  organization_id: string;
  usage_id: string;
  policy_id: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  userId: string | null;
  token: string | null;
  email: string | null;
  displayName: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const login = async () => {
    // No-op: authentication removed
  };

  const logout = async () => {
    // Clear chat history from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("it-helpdesk-messages");
      localStorage.removeItem("it-helpdesk-session-id");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        userId: "demo-user-001",
        token: "demo-token",
        email: "demo@company.com",
        displayName: "Demo User",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
