import { apiClient, unwrapApiData } from "./client";
import type { Agent, CreateAgentPayload, ApiResponse } from "../types";

export const agentsApi = {
  getAll: async (): Promise<ApiResponse<Agent[]>> => {
    try {
      const response = await apiClient.get("/agents");
      return { success: true, data: unwrapApiData<Agent[]>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch agents",
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Agent>> => {
    try {
      const response = await apiClient.get(`/agents/${id}`);
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
      const response = await apiClient.post("/agents", payload);
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
      const response = await apiClient.put(`/agents/${id}`, payload);
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
      await apiClient.delete(`/agents/${id}`);
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
