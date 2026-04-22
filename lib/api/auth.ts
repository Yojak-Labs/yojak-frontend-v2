import { apiClient, setAccessToken, setRefreshToken, clearTokens } from "./client";
import type { LoginPayload, RegisterPayload, LoginResponse, ApiResponse } from "../types";

type BackendEnvelope<T> = {
  data?: T;
  status?: number;
  error?: string | null;
  message?: string;
};

const unwrapAuthData = <T,>(payload: BackendEnvelope<T> | T): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    const envelope = payload as BackendEnvelope<T>;
    if (envelope.data !== undefined) {
      return envelope.data;
    }
  }

  return payload as T;
};

const normalizeToken = (token: string | null | undefined) => {
  if (typeof token !== "string") return null;
  const trimmed = token.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
  return trimmed;
};

const extractTokensFromAuthData = (payload: unknown) => {
  const data = payload as
    | {
        token?: string;
        accessToken?: string;
        access_token?: string;
        jwt?: string;
        refreshToken?: string;
        refresh_token?: string;
      }
    | undefined;

  return {
    token: normalizeToken(data?.token || data?.accessToken || data?.access_token || data?.jwt),
    refreshToken: normalizeToken(data?.refreshToken || data?.refresh_token),
  };
};

export const authApi = {
  register: async (payload: RegisterPayload): Promise<ApiResponse<unknown>> => {
    try {
      const response = await apiClient.post("/auth/register", payload);
      return { success: true, data: unwrapAuthData(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Registration failed",
      };
    }
  },

  login: async (payload: LoginPayload): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await apiClient.post("/auth/login", payload);
      const data = unwrapAuthData<LoginResponse & { access_token?: string; refresh_token?: string }>(
        response.data
      );
      const tokens = extractTokensFromAuthData(data);
      
      if (tokens.token && tokens.refreshToken) {
        setAccessToken(tokens.token);
        setRefreshToken(tokens.refreshToken);
        if (typeof window !== "undefined") {
          if (data.userId) localStorage.setItem("userId", data.userId);
          if (data.role) localStorage.setItem("userRole", data.role);
        }
      }
      
      return {
        success: true,
        data: {
          ...data,
          token: tokens.token || data.token,
          refreshToken: tokens.refreshToken || data.refreshToken,
        },
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Login failed",
      };
    }
  },

  logout: () => {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  sendOtp: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiClient.post("/auth/send-otp", { email });
      return { success: true, data: unwrapAuthData(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to send OTP",
      };
    }
  },

  verifyOtp: async (email: string, otp: string): Promise<ApiResponse<{ verified: boolean } | boolean>> => {
    try {
      const response = await apiClient.post("/auth/verify-otp", { email, otp });
      return { success: true, data: unwrapAuthData(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "OTP verification failed",
      };
    }
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiClient.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Password reset failed",
      };
    }
  },

  checkHealth: async (): Promise<ApiResponse<{ status: string }>> => {
    try {
      const response = await apiClient.get("/health");
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Health check failed",
      };
    }
  },
};
