"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { decodeJwtPayload, setAccessToken, clearTokens } from "@/lib/api/client";
import { usersApi } from "@/lib/api/users";
import { adminApi } from "@/lib/api/admin";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, setUser, setIsLoading, setIsAuthenticated } = useAuthStore();

  const isValidStoredToken = (value: string | null) => {
    if (!value) return false;
    const trimmed = value.trim();
    return trimmed !== "undefined" && trimmed !== "null";
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("accessToken");

        if (isAuthenticated && user && storedToken) {
          setAccessToken(storedToken);
          return;
        }

        if (isValidStoredToken(storedToken)) {
          setAccessToken(storedToken);
          const tokenClaims = decodeJwtPayload<{
            userId?: string;
            email?: string;
            role?: string;
            roles?: string[];
          }>(storedToken);
          const resolvedRole =
            (tokenClaims?.role as "admin" | "user" | undefined) ||
            ((tokenClaims?.roles?.[0] as "admin" | "user" | undefined) ?? "user");

          const authRequest =
            resolvedRole === "admin" ? adminApi.getMe() : usersApi.getById();
          const timeoutRequest = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Auth profile request timeout")), 8000)
          );

          const response = await Promise.race([authRequest, timeoutRequest]);
          if (response.success && response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
            return;
          }
        }

        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [isAuthenticated, setUser, setIsLoading, setIsAuthenticated, user]);

  return <>{children}</>;
}
