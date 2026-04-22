import { apiClient, unwrapApiData } from "./client";
import type { Tool, CreateToolPayload, ApiResponse } from "../types";

export const toolsApi = {
  getAll: async (): Promise<ApiResponse<Tool[]>> => {
    try {
      const response = await apiClient.get("/tools");
      return { success: true, data: unwrapApiData<Tool[]>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch tools",
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Tool>> => {
    try {
      const response = await apiClient.get(`/tools/${id}`);
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
      const response = await apiClient.post("/tools", payload);
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
      const response = await apiClient.put(`/tools/${id}`, payload);
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
      await apiClient.delete(`/tools/${id}`);
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
