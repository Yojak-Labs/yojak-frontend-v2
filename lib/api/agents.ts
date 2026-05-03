import { apiClient, unwrapApiData } from "./client";
import type { Agent, CreateAgentPayload, ApiResponse } from "../types";

const resolveAgentsBasePath = () => {
  const baseUrl = apiClient.defaults.baseURL || "";
  // If the configured baseURL already includes `/v1/yojakai`, don't double-prefix it.
  return baseUrl.includes("/v1/yojakai") ? "/agents" : "/v1/yojakai/agents";
};

const resolveAgentByIdPath = (id: string) => `${resolveAgentsBasePath()}/${encodeURIComponent(id)}`;

const unwrapAgentsList = (payload: unknown): Agent[] => {
  const unwrapped = unwrapApiData<unknown>(payload);

  const extract = (value: unknown, depth = 0): Agent[] | null => {
    if (depth > 6) return null;
    if (Array.isArray(value)) return value as Agent[];
    if (!value || typeof value !== "object") return null;

    const record = value as Record<string, unknown>;
    const candidates = [
      record.agents,
      record.data,
      record.items,
      record.results,
      record.result,
    ];

    for (const candidate of candidates) {
      const extracted = extract(candidate, depth + 1);
      if (extracted) return extracted;
    }

    return null;
  };

  return extract(unwrapped) || [];
};

export const agentsApi = {
  getAll: async (): Promise<ApiResponse<Agent[]>> => {
    try {
      const response = await apiClient.get(resolveAgentsBasePath());
      return { success: true, data: unwrapAgentsList(response.data) };
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
      };

      // Some deployments return 404 when the collection is empty.
      if (err.response?.status === 404) {
        return { success: true, data: [] };
      }

      const responseData = (err.response as unknown as { data?: unknown } | undefined)?.data;
      const responseMessage =
        typeof responseData === "string" && responseData.trim() ? responseData.trim() : undefined;
      return {
        success: false,
        error:
          err.response?.data?.message ||
          responseMessage ||
          "Failed to fetch agents",
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Agent>> => {
    try {
      const response = await apiClient.get(resolveAgentByIdPath(id));
      return { success: true, data: unwrapApiData<Agent>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch agent",
      };
    }
  },

  create: async (payload: CreateAgentPayload): Promise<ApiResponse<Agent>> => {
    try {
      const response = await apiClient.post(resolveAgentsBasePath(), payload);
      return { success: true, data: unwrapApiData<Agent>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to create agent",
      };
    }
  },

  update: async (id: string, payload: Partial<CreateAgentPayload>): Promise<ApiResponse<Agent>> => {
    try {
      const response = await apiClient.put(resolveAgentByIdPath(id), payload);
      return { success: true, data: unwrapApiData<Agent>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to update agent",
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      await apiClient.delete(resolveAgentByIdPath(id));
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to delete agent",
      };
    }
  },
};
