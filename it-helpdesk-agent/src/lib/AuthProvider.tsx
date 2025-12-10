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
      // Clear sessionStorage auth flag
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("auth_verified");
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
      // Persist auth state in sessionStorage for faster page loads
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_verified", "true");
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
      const { default: lyzr } = await import("lyzr-agent");
      await lyzr.logout(); // Ensure clean state before attempting login
      await lyzr.init("pk_c14a2728e715d9ea67bf");
      await clearAuthData();
      await checkAuth();
      await lyzr.getKeys(); // This will trigger the login modal
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    if (typeof window === "undefined") return;
    try {
      const { default: lyzr } = await import("lyzr-agent");
      await lyzr.logout();
      clearAuthData({ markInitialized: true });
      window.location.href = window.location.origin;
    } catch (error) {
      console.error("Logout failed:", error);
      clearAuthData({ markInitialized: true });
    }
  };

  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return;
      try {
        const { default: lyzr } = await import("lyzr-agent");
        await lyzr.init("pk_c14a2728e715d9ea67bf");

        const unsubscribe = lyzr.onAuthStateChange((isAuth: boolean) => {
          if (isAuth) {
            void checkAuth();
          } else {
            clearAuthData({ markInitialized: true });
          }
        });

        // Warm-restore from stored state to avoid SDK popup:
        // 1) If cookies + auth_verified flag exist, hydrate state from storage without hitting SDK.
        // 2) If cookies exist but no verified flag, run checkAuth (may prompt if session really expired).
        // 3) If no cookies, just mark initialized so UI can show login screen without SDK popup.
        const userIdCookie = Cookies.get("user_id");
        const tokenCookie = Cookies.get("token");
        const authVerified = sessionStorage.getItem("auth_verified") === "true";
        const storedEmail = sessionStorage.getItem("auth_email");
        const storedName = sessionStorage.getItem("auth_name");

        if (userIdCookie && tokenCookie && authVerified) {
          // Fast restore from storage, no SDK call
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
        } else if (userIdCookie && tokenCookie) {
          // Have cookies but no verified flag — do a real check (may show SDK UI if session expired)
          void checkAuth();
        } else {
          // No prior session; mark initialized so UI can show login screen without SDK popup
          setIsLoading(false);
          setIsInitialized(true);
        }

        return () => unsubscribe();
      } catch (err) {
        console.error("Lyzr init failed:", err);
        clearAuthData({ markInitialized: true });
      }
    };
    void init();
  }, [checkAuth, clearAuthData]);

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
