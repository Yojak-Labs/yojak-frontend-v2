import { apiClient, unwrapApiData } from "./client";
import type { Task, CreateTaskPayload, ApiResponse, TaskStatus } from "../types";

export const tasksApi = {
  getAll: async (filters?: { status?: TaskStatus; projectId?: string }): Promise<ApiResponse<Task[]>> => {
    try {
      const params: Record<string, string> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.projectId) params.projectId = filters.projectId;
      
      const response = await apiClient.get("/tasks", { params });
      return { success: true, data: unwrapApiData<Task[]>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch tasks",
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Task>> => {
    try {
      const response = await apiClient.get(`/tasks/${id}`);
      return { success: true, data: unwrapApiData<Task>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch task",
      };
    }
  },

  create: async (payload: CreateTaskPayload): Promise<ApiResponse<Task>> => {
    try {
      const response = await apiClient.post("/tasks", payload);
      return { success: true, data: unwrapApiData<Task>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to create task",
      };
    }
  },

  update: async (id: string, payload: Partial<CreateTaskPayload>): Promise<ApiResponse<Task>> => {
    try {
      const response = await apiClient.put(`/tasks/${id}`, payload);
      return { success: true, data: unwrapApiData<Task>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to update task",
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      await apiClient.delete(`/tasks/${id}`);
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to delete task",
      };
    }
  },
};
