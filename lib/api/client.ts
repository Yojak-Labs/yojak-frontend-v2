import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const normalizeBaseUrl = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;
  return trimmed.includes("/v1/yojakai") ? trimmed : `${trimmed}/v1/yojakai`;
};

const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "https://yojak-backend.onrender.com/v1/yojakai"
);

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
let accessToken: string | null = null;

const normalizeToken = (token: string | null | undefined) => {
  if (typeof token !== "string") return null;
  const trimmed = token.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
  return trimmed;
};

const extractTokensFromPayload = (payload: unknown) => {
  const source = payload as
    | {
        data?: unknown;
        token?: string;
        accessToken?: string;
        access_token?: string;
        jwt?: string;
        refreshToken?: string;
        refresh_token?: string;
      }
    | undefined;

  const nested = (source?.data ?? null) as
    | {
        token?: string;
        accessToken?: string;
        access_token?: string;
        jwt?: string;
        refreshToken?: string;
        refresh_token?: string;
      }
    | null;

  const token = normalizeToken(
    source?.token ||
      source?.accessToken ||
      source?.access_token ||
      source?.jwt ||
      nested?.token ||
      nested?.accessToken ||
      nested?.access_token ||
      nested?.jwt
  );
  const refreshToken = normalizeToken(
    source?.refreshToken || source?.refresh_token || nested?.refreshToken || nested?.refresh_token
  );

  return { token, refreshToken };
};

export const setAccessToken = (token: string | null) => {
  accessToken = normalizeToken(token);
  if (typeof window !== "undefined") {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }
  }
};

export const getAccessToken = () => accessToken;

export const unwrapApiData = <T,>(payload: unknown): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    const envelope = payload as { data?: T };
    if (envelope.data !== undefined) {
      return envelope.data;
    }
  }

  return payload as T;
};

export const decodeJwtPayload = <T extends Record<string, unknown> = Record<string, unknown>>(
  token: string | null | undefined
): T | null => {
  const normalized = normalizeToken(token);
  if (!normalized) return null;

  try {
    const parts = normalized.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refreshToken");
  }
  return null;
};

const hasStoredAuthSession = () => {
  if (typeof window === "undefined") return !!accessToken;
  const storedAccessToken = normalizeToken(localStorage.getItem("accessToken"));
  const storedRefreshToken = normalizeToken(localStorage.getItem("refreshToken"));
  const inMemoryAccessToken = normalizeToken(accessToken);
  return !!(inMemoryAccessToken || storedAccessToken || storedRefreshToken);
};

export const setRefreshToken = (token: string | null) => {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("refreshToken", token);
    } else {
      localStorage.removeItem("refreshToken");
    }
  }
};

export const clearTokens = () => {
  accessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!accessToken && typeof window !== "undefined") {
      const storedAccessToken = localStorage.getItem("accessToken");
      accessToken = normalizeToken(storedAccessToken);
    }
    if (accessToken) {
      const headers = (config.headers ?? ({} as unknown)) as Record<string, unknown>;
      headers.Authorization = `Bearer ${accessToken}`;
      config.headers = headers as unknown as typeof config.headers;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const requestUrl = originalRequest?.url || "";
    const isRefreshEndpoint = requestUrl.includes("/auth/refresh-token");

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      const hasActiveAuthSession = hasStoredAuthSession();
      if (!hasActiveAuthSession) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err: unknown) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        const shouldRedirectToLogin = hasStoredAuthSession();
        clearTokens();
        if (typeof window !== "undefined" && shouldRedirectToLogin) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
          refresh_token: refreshToken,
        });

        const refreshPayload = unwrapApiData<unknown>(response.data);
        const tokens = extractTokensFromPayload(refreshPayload);
        if (!tokens.token || !tokens.refreshToken) {
          throw new Error("Invalid refresh response");
        }
        setAccessToken(tokens.token);
        setRefreshToken(tokens.refreshToken);

        processQueue(null, tokens.token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        const shouldRedirectToLogin = hasStoredAuthSession();
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== "undefined" && shouldRedirectToLogin) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
