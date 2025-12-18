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
  isInitialized: boolean; // Keep for backward compatibility
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Use refs to track auth API call state and prevent duplicate calls
  const authCallInProgress = useRef(false);
  const lastSuccessfulAuthCall = useRef<string | null>(null);

  const clearAuthData = useCallback(() => {
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
  }, []);

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
        clearAuthData();
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      clearAuthData();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      authCallInProgress.current = false;
    }
  }, [clearAuthData, setAuthData]);

  const login = async () => {
    if (typeof window === "undefined") return;
    try {
      const { default: lyzr } = await import("lyzr-agent");
      
      const lyzrPublicKey = process.env.NEXT_PUBLIC_LYZR_PUBLIC_KEY;
      if (!lyzrPublicKey) {
        throw new Error(
          "NEXT_PUBLIC_LYZR_PUBLIC_KEY environment variable is required"
        );
      }

      await lyzr.logout(); // Ensure clean state before attempting login
      await lyzr.init(lyzrPublicKey);
      clearAuthData();
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
      clearAuthData();
      
      // Clear chat history from localStorage
      localStorage.removeItem("it-helpdesk-messages");
      localStorage.removeItem("it-helpdesk-session-id");
      
      window.location.href = window.location.origin;
    } catch (error) {
      console.error("Logout failed:", error);
      clearAuthData();
      // Still clear chat history even if logout fails
      localStorage.removeItem("it-helpdesk-messages");
      localStorage.removeItem("it-helpdesk-session-id");
    }
  };

  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return;

      // Check for token in URL query parameters first
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");

      // If token is in URL, try to authenticate with it
      if (urlToken) {
        try {
          setIsLoading(true);

          // Decode JWT token to extract user info (Memberstack token)
          interface DecodedToken {
            id?: string;
            email?: string;
            name?: string;
            organization_id?: string;
            [key: string]: unknown;
          }
          let decodedToken: DecodedToken | null = null;
          try {
            const base64Url = urlToken.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join("")
            );
            decodedToken = JSON.parse(jsonPayload);
            console.log("Decoded token:", decodedToken);
          } catch (decodeError) {
            console.error("Error decoding token:", decodeError);
            throw new Error("Invalid token format");
          }

          // Try to exchange token with backend API
          const authResponse = await fetch("/api/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: urlToken }),
          });

          if (authResponse.ok) {
            const authData = await authResponse.json();

            if (authData.user && authData.lyzrApiKey) {
              // Use the returned data to authenticate
              const userId = decodedToken.id || authData.user.id;
              const userEmail =
                authData.user.email || decodedToken.email || null;
              const userName = authData.user.name || decodedToken.name || null;

              const nameFromEmail = userEmail
                ? userEmail.split("@")[0].charAt(0).toUpperCase() +
                  userEmail.split("@")[0].slice(1)
                : "User";
              const finalUserName = userName || nameFromEmail;

              // Set auth data directly
              setAuthData(
                {
                  _id: "",
                  api_key: authData.lyzrApiKey,
                  user_id: userId,
                  organization_id: decodedToken.organization_id || "",
                  usage_id: "",
                  policy_id: "",
                },
                userEmail,
                finalUserName
              );

              // Clean up URL by removing token parameter
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete("token");
              window.history.replaceState({}, "", newUrl.toString());

              setIsLoading(false);
              return;
            }
          } else {
            const errorData = await authResponse.json().catch(() => ({}));
            console.error("Token exchange failed:", errorData);
            
            // If user not found, clean up URL and continue with normal SDK flow
            if (authResponse.status === 404 && errorData.requiresSdkAuth) {
              console.log(
                "User not found in database, continuing with SDK authentication"
              );
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete("token");
              window.history.replaceState({}, "", newUrl.toString());
            }
          }
        } catch (error) {
          console.error("Error authenticating with URL token:", error);
          // Clean up URL on error
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("token");
          window.history.replaceState({}, "", newUrl.toString());
        }
      }

      // Initialize SDK and set up auth state listener (following reference pattern)
      try {
        const { default: lyzr } = await import("lyzr-agent");
        
        const lyzrPublicKey = process.env.NEXT_PUBLIC_LYZR_PUBLIC_KEY;
        if (!lyzrPublicKey) {
          console.error("NEXT_PUBLIC_LYZR_PUBLIC_KEY not set");
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        await lyzr.init(lyzrPublicKey);

        const unsubscribe = lyzr.onAuthStateChange((isAuth) => {
          if (isAuth) {
            checkAuth();
          } else {
            clearAuthData();
          }
        });

        // Perform initial check silently
        try {
          const tokenData = (await lyzr.getKeys()) as unknown as TokenData[];
          if (tokenData && tokenData[0]) {
            await checkAuth();
          } else {
            setIsLoading(false);
            setIsInitialized(true);
          }
        } catch {
          setIsLoading(false); // Not logged in
          setIsInitialized(true);
        }

        return () => unsubscribe();
      } catch (err) {
        console.error("Lyzr init failed:", err);
        clearAuthData();
        setIsInitialized(true);
      }
    };
    void init();
  }, [checkAuth, clearAuthData, setAuthData]);

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
