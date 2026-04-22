import { apiClient, unwrapApiData } from "./client";
import type { Admin, CreateAdminPayload, ApiResponse, AccountStatus, User } from "../types";

export const adminApi = {
  getAll: async (status?: AccountStatus): Promise<ApiResponse<Admin[]>> => {
    try {
      const response = await apiClient.get("/admin", {
        params: status ? { status } : undefined,
      });
      return { success: true, data: unwrapApiData<Admin[]>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch admins",
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Admin>> => {
    try {
      const response = await apiClient.get(`/admin/${id}`);
      return { success: true, data: unwrapApiData<Admin>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch admin",
      };
    }
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await apiClient.get("/admin/me");
      return { success: true, data: unwrapApiData<User>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch admin profile",
      };
    }
  },

  create: async (payload: CreateAdminPayload): Promise<ApiResponse<Admin>> => {
    try {
      const response = await apiClient.post("/admin", payload);
      return { success: true, data: unwrapApiData<Admin>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to create admin",
      };
    }
  },

  update: async (id: string, payload: Partial<CreateAdminPayload>): Promise<ApiResponse<Admin>> => {
    try {
      const response = await apiClient.put(`/admin/${id}`, payload);
      return { success: true, data: unwrapApiData<Admin>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to update admin",
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      await apiClient.delete(`/admin/${id}`);
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to delete admin",
      };
    }
  },
};
