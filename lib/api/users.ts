import { apiClient, unwrapApiData } from "./client";
import type { User, ApiResponse, UpdateUserRequest, AccountStatus } from "../types";

export const usersApi = {
  getAll: async (status?: AccountStatus): Promise<ApiResponse<User[]>> => {
    try {
      const response = await apiClient.get("/users", {
        params: status ? { status } : undefined,
      });
      return { success: true, data: unwrapApiData<User[]>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch users",
      };
    }
  },

  getById: async (id?: string): Promise<ApiResponse<User>> => {
    try {
      const path = id ? `/users/${id}` : "/users/me";
      const response = await apiClient.get(path);
      return { success: true, data: unwrapApiData<User>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch user",
      };
    }
  },

  update: async (payload: UpdateUserRequest): Promise<ApiResponse<User>> => {
    try {
      const response = await apiClient.put("/users", payload);
      return { success: true, data: unwrapApiData<User>(response.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to update user",
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      await apiClient.delete(`/users/${id}`);
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to delete user",
      };
    }
  },
};
