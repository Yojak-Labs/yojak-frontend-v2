import { apiClient, unwrapApiData } from "./client";
import type { Task, CreateTaskPayload, UpdateTaskPayload, ApiResponse, TaskStatus } from "../types";

/**
 * Backend task list API:
 *   GET /v1/yojakai/tasks
 * Query params (optional):
 *   - projectId: filter by project UUID
 *   - status: todo | in_progress | done | blocked
 * Auth: Bearer JWT (user role)
 */
const sortByExecutionOrder = (tasks: Task[]) =>
  [...tasks].sort((a, b) => {
    const left = a.execution_order ?? Number.MAX_SAFE_INTEGER;
    const right = b.execution_order ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });

const toEditableTaskPayload = (payload: UpdateTaskPayload): UpdateTaskPayload => {
  const {
    title,
    description,
    priority,
    status,
    estimated_hours,
    start_date,
    end_date,
    due_date,
  } = payload;

  return {
    title,
    description,
    priority,
    status,
    estimated_hours,
    start_date,
    end_date,
    due_date,
  };
};

export const tasksApi = {
  getAll: async (filters?: { status?: TaskStatus; projectId?: string }): Promise<ApiResponse<Task[]>> => {
    try {
      const params: Record<string, string> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.projectId) params.projectId = filters.projectId;

      const response = await apiClient.get("/tasks", { params });
      const tasks = unwrapApiData<Task[]>(response.data) ?? [];
      return {
        success: true,
        data: filters?.projectId ? sortByExecutionOrder(tasks) : tasks,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch tasks",
      };
    }
  },

  getByProject: async (projectId: string, status?: TaskStatus): Promise<ApiResponse<Task[]>> => {
    return tasksApi.getAll({ projectId, status });
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

  update: async (id: string, payload: UpdateTaskPayload): Promise<ApiResponse<Task>> => {
    try {
      const response = await apiClient.put(`/tasks/${id}`, toEditableTaskPayload(payload));
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
