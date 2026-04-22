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
      const storedToken = localStorage.getItem("accessToken");

      if (isAuthenticated && user && storedToken) {
        setAccessToken(storedToken);
        setIsLoading(false);
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
        try {
          const response =
            resolvedRole === "admin" ? await adminApi.getMe() : await usersApi.getById();
          if (response.success && response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            setUser({
              id: tokenClaims?.userId || "current-user",
              email: tokenClaims?.email || "",
              name: tokenClaims?.email?.split("@")[0] || "User",
              role: resolvedRole,
            });
            setIsAuthenticated(true);
          }
        } catch {
          setUser({
            id: tokenClaims?.userId || "current-user",
            email: tokenClaims?.email || "",
            name: tokenClaims?.email?.split("@")[0] || "User",
            role: resolvedRole,
          });
          setIsAuthenticated(true);
        }
      } else {
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    initAuth();
  }, [setUser, setIsLoading, setIsAuthenticated]);

  return <>{children}</>;
}
