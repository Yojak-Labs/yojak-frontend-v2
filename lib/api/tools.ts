import { apiClient, unwrapApiData } from "./client";
import type { Tool, CreateToolPayload, ApiResponse } from "../types";

const resolveToolsBasePath = () => {
  const baseUrl = apiClient.defaults.baseURL || "";
  // If the configured baseURL already includes `/v1/yojakai`, don't double-prefix it.
  return baseUrl.includes("/v1/yojakai") ? "/tools" : "/v1/yojakai/tools";
};

const resolveToolByIdPath = (id: string) => `${resolveToolsBasePath()}/${encodeURIComponent(id)}`;

const unwrapToolsList = (payload: unknown): Tool[] => {
  const unwrapped = unwrapApiData<unknown>(payload);
  if (Array.isArray(unwrapped)) return unwrapped as Tool[];

  if (unwrapped && typeof unwrapped === "object") {
    const record = unwrapped as Record<string, unknown>;
    const nested = record.tools ?? record.items ?? record.data ?? record.results ?? record.result;
    if (Array.isArray(nested)) return nested as Tool[];
  }

  return [];
};

export const toolsApi = {
  getAll: async (): Promise<ApiResponse<Tool[]>> => {
    try {
      const response = await apiClient.get(resolveToolsBasePath());
      return { success: true, data: unwrapToolsList(response.data) };
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
        error: err.response?.data?.message || responseMessage || "Failed to fetch tools",
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Tool>> => {
    try {
      const response = await apiClient.get(resolveToolByIdPath(id));
      return { success: true, data: unwrapApiData<Tool>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch tool",
      };
    }
  },

  create: async (payload: CreateToolPayload): Promise<ApiResponse<Tool>> => {
    try {
      const response = await apiClient.post(resolveToolsBasePath(), payload);
      return { success: true, data: unwrapApiData<Tool>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to create tool",
      };
    }
  },

  update: async (id: string, payload: Partial<CreateToolPayload>): Promise<ApiResponse<Tool>> => {
    try {
      const response = await apiClient.put(resolveToolByIdPath(id), payload);
      return { success: true, data: unwrapApiData<Tool>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to update tool",
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      await apiClient.delete(resolveToolByIdPath(id));
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to delete tool",
      };
    }
  },
};
