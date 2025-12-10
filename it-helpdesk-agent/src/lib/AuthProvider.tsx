"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";

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
  isInitialized: boolean; // True only after first auth check is complete
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
  // Avoid SSR mismatch; client-only hydration will restore from storage
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // Only true after first auth check
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Use refs to track auth API call state and prevent duplicate calls
  const authCallInProgress = useRef(false);
  const lastSuccessfulAuthCall = useRef<string | null>(null);

  const clearAuthData = useCallback(
    (options?: { markInitialized?: boolean }) => {
      Cookies.remove("user_id");
      Cookies.remove("token");
      setIsAuthenticated(false);
      setUserId(null);
      setToken(null);
      setEmail(null);
      setDisplayName(null);
      setIsLoading(false);
      // Reset auth tracking refs
      authCallInProgress.current = false;
      lastSuccessfulAuthCall.current = null;
      // Clear ALL sessionStorage auth flags
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("session_trusted");
        sessionStorage.removeItem("auth_email");
        sessionStorage.removeItem("auth_name");
        sessionStorage.removeItem("auth_verified"); // Legacy cleanup
      }
      if (options?.markInitialized) {
        setIsInitialized(true);
      }
    },
    []
  );

  const setAuthData = useCallback(
    (
      tokenData: TokenData,
      userEmail: string | null,
      userName: string | null
    ) => {
      setIsAuthenticated(true);
      setUserId(tokenData.user_id);
      setToken(tokenData.api_key);
      setEmail(userEmail);
      setDisplayName(userName);
      setIsInitialized(true);
      Cookies.set("user_id", tokenData.user_id, { expires: 7 });
      Cookies.set("token", tokenData.api_key, { expires: 7 });
      // Mark session as trusted for browser session - avoids SDK popup on refresh
      if (typeof window !== "undefined") {
        sessionStorage.setItem("session_trusted", "true");
        if (userEmail) sessionStorage.setItem("auth_email", userEmail);
        if (userName) sessionStorage.setItem("auth_name", userName);
      }
    },
    []
  );

  const checkAuth = useCallback(async () => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    // Prevent duplicate calls - if already in progress, skip
    if (authCallInProgress.current) {
      console.log("Auth check already in progress, skipping duplicate call");
      return;
    }

    setIsLoading(true);
    authCallInProgress.current = true;

    try {
      const { default: lyzr } = await import("lyzr-agent");
      const tokenData = (await lyzr.getKeys()) as unknown as TokenData[];

      if (tokenData && tokenData[0]) {
        const currentUserId = tokenData[0].user_id;

        // Check if we already successfully synced this user recently
        if (lastSuccessfulAuthCall.current === currentUserId) {
          console.log(
            "User already synced with backend, skipping duplicate API call"
          );

          // Just update local state without calling backend
          let userEmail: string | null = null;
          let userName: string | null = null;

          try {
            const userKeys = await lyzr.getKeysUser();
            userEmail = userKeys?.data?.user?.email;
            userName = userKeys?.data?.user?.name;
          } catch (error) {
            console.error(
              "Error fetching user keys, proceeding with token data only.",
              error
            );
          }

          const nameFromEmail = userEmail
            ? userEmail.split("@")[0].charAt(0).toUpperCase() +
              userEmail.split("@")[0].slice(1)
            : "User";
          const finalUserName = userName || nameFromEmail;

          setAuthData(tokenData[0], userEmail, finalUserName);
          return;
        }

        let userEmail: string | null = null;
        let userName: string | null = null;

        try {
          const userKeys = await lyzr.getKeysUser();
          userEmail = userKeys?.data?.user?.email;
          userName = userKeys?.data?.user?.name;
        } catch (error) {
          console.error(
            "Error fetching user keys, proceeding with token data only.",
            error
          );
        }

        const nameFromEmail = userEmail
          ? userEmail.split("@")[0].charAt(0).toUpperCase() +
            userEmail.split("@")[0].slice(1)
          : "User";
        const finalUserName = userName || nameFromEmail;

        // Sync with backend - only once per user session
        console.log("Syncing user with backend...");
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: {
              id: tokenData[0].user_id,
              email: userEmail,
              name: finalUserName,
            },
            lyzrApiKey: tokenData[0].api_key,
          }),
        });

        // Mark this user as successfully synced
        lastSuccessfulAuthCall.current = currentUserId;
        console.log("✓ User successfully synced with backend");

        setAuthData(tokenData[0], userEmail, finalUserName);
      } else {
        clearAuthData({ markInitialized: true });
      }
    } catch (err) {
      // Silently handle expected authentication errors
      clearAuthData({ markInitialized: true });
    } finally {
      setIsLoading(false);
      setIsInitialized(true); // Always mark as initialized after first check
      authCallInProgress.current = false;
    }
  }, [clearAuthData, setAuthData]);

  const login = async () => {
    if (typeof window === "undefined") return;
    try {
      setIsLoading(true);
      setIsInitialized(false);

      const { default: lyzr } = await import("lyzr-agent");

      // Initialize SDK (will show the login modal)
      await lyzr.init("pk_c14a2728e715d9ea67bf");

      // Set up auth state change listener
      lyzr.onAuthStateChange((isAuth: boolean) => {
        if (isAuth) {
          void checkAuth();
        } else {
          clearAuthData({ markInitialized: true });
        }
      });

      // Trigger login flow which will show SDK modal and get tokens
      const tokenData = (await lyzr.getKeys()) as unknown as TokenData[];

      if (tokenData && tokenData[0]) {
        // Get user details
        let userEmail: string | null = null;
        let userName: string | null = null;

        try {
          const userKeys = await lyzr.getKeysUser();
          userEmail = userKeys?.data?.user?.email;
          userName = userKeys?.data?.user?.name;
        } catch (error) {
          console.error("Error fetching user keys:", error);
        }

        const nameFromEmail = userEmail
          ? userEmail.split("@")[0].charAt(0).toUpperCase() +
            userEmail.split("@")[0].slice(1)
          : "User";
        const finalUserName = userName || nameFromEmail;

        // Sync with backend
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: {
              id: tokenData[0].user_id,
              email: userEmail,
              name: finalUserName,
            },
            lyzrApiKey: tokenData[0].api_key,
          }),
        });

        // Set auth data and mark as initialized
        setAuthData(tokenData[0], userEmail, finalUserName);
        setIsLoading(false);
      } else {
        throw new Error("No token data received from login");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const logout = async () => {
    if (typeof window === "undefined") return;
    try {
      // Clear local auth state immediately
      clearAuthData({ markInitialized: true });

      // Clear chat history from localStorage
      localStorage.removeItem("it-helpdesk-messages");
      localStorage.removeItem("it-helpdesk-session-id");

      // Try to logout from SDK if it was initialized
      try {
        const { default: lyzr } = await import("lyzr-agent");
        await lyzr.logout();
      } catch (err) {
        // SDK might not be initialized, that's ok
        console.log("SDK not initialized, skipping SDK logout");
      }

      // Redirect to home
      window.location.href = window.location.origin;
    } catch (error) {
      console.error("Logout failed:", error);
      clearAuthData({ markInitialized: true });
      // Still clear chat history even if logout fails
      localStorage.removeItem("it-helpdesk-messages");
      localStorage.removeItem("it-helpdesk-session-id");
    }
  };

  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return;

      // Check for trusted session BEFORE initializing SDK to prevent popup
      const userIdCookie = Cookies.get("user_id");
      const tokenCookie = Cookies.get("token");
      const sessionTrusted =
        sessionStorage.getItem("session_trusted") === "true";
      const storedEmail = sessionStorage.getItem("auth_email");
      const storedName = sessionStorage.getItem("auth_name");

      if (userIdCookie && tokenCookie && sessionTrusted) {
        // Trusted session exists - restore immediately WITHOUT initializing SDK
        console.log("✓ Restoring trusted session from cache (no SDK init)");
        setAuthData(
          {
            _id: "",
            api_key: tokenCookie,
            user_id: userIdCookie,
            organization_id: "",
            usage_id: "",
            policy_id: "",
          },
          storedEmail,
          storedName
        );
        setIsInitialized(true);
        setIsLoading(false);
        return; // Exit early - don't initialize SDK
      }

      // No trusted session - mark initialized so our login UI shows (no SDK init yet)
      console.log(
        "No trusted session found, showing login UI (SDK not initialized)"
      );
      setIsLoading(false);
      setIsInitialized(true);
    };
    void init();
  }, [setAuthData]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isInitialized,
        userId,
        token,
        email,
        displayName,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
