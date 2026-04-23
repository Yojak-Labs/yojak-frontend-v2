import { apiClient, unwrapApiData } from "./client";
import type { Project, CreateProjectPayload, ApiResponse, ProjectStatus } from "../types";

const getProjectApiErrorMessage = (error: unknown, fallback: string) => {
  const err = error as {
    response?: { data?: unknown };
    message?: string;
  };
  const responseData = err.response?.data as
    | {
        message?: string;
        detail?: string;
        error?:
          | string
          | {
              message?: string;
              detail?: string;
            };
        data?: {
          message?: string;
          detail?: string;
          error?:
            | string
            | {
                message?: string;
                detail?: string;
              };
        } | null;
      }
    | string
    | undefined;

  const asString = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined;

  const errorObject =
    typeof responseData === "object" && responseData && "error" in responseData
      ? responseData.error
      : undefined;
  const nestedData =
    typeof responseData === "object" && responseData && "data" in responseData
      ? responseData.data
      : undefined;
  const nestedError =
    nestedData && typeof nestedData === "object" && "error" in nestedData ? nestedData.error : undefined;

  return (
    asString(typeof errorObject === "object" ? errorObject?.message : undefined) ||
    asString(typeof errorObject === "object" ? errorObject?.detail : undefined) ||
    asString(errorObject) ||
    asString(typeof nestedError === "object" ? nestedError?.message : undefined) ||
    asString(typeof nestedError === "object" ? nestedError?.detail : undefined) ||
    asString(nestedError) ||
    asString(typeof nestedData === "object" ? nestedData?.message : undefined) ||
    asString(typeof nestedData === "object" ? nestedData?.detail : undefined) ||
    asString(typeof responseData === "object" ? responseData?.message : undefined) ||
    asString(typeof responseData === "object" ? responseData?.detail : undefined) ||
    asString(responseData) ||
    asString(err.message) ||
    fallback
  );
};

const buildProjectsEndpoint = (basePath: string, status?: ProjectStatus) =>
  status ? `${basePath}?status=${encodeURIComponent(status)}` : basePath;

const resolveAdminProjectsBasePath = () => {
  const baseUrl = apiClient.defaults.baseURL || "";
  // If the configured baseURL already includes `/v1/yojakai`, don't double-prefix it.
  return baseUrl.includes("/v1/yojakai") ? "/admin/projects" : "/v1/yojakai/admin/projects";
};

export const projectsApi = {
  getAll: async (status?: ProjectStatus): Promise<ApiResponse<Project[]>> => {
    try {
      const endpoint = buildProjectsEndpoint("/projects", status);
      const response = await apiClient.get(endpoint);
      return { success: true, data: unwrapApiData<Project[]>(response.data) };
    } catch (error: unknown) {
      return {
        success: false,
        error: getProjectApiErrorMessage(error, "Failed to fetch projects"),
      };
    }
  },

  getAllAdmin: async (status?: ProjectStatus): Promise<ApiResponse<Project[]>> => {
    const adminEndpoint = resolveAdminProjectsBasePath();

    try {
      // Backend expects `status` to exist in the query even when unfiltered.
      const response = await apiClient.get(adminEndpoint, {
        params: { status: status ?? "" },
      });
      return { success: true, data: unwrapApiData<Project[]>(response.data) };
    } catch (error: unknown) {
      const httpStatus = (error as { response?: { status?: number } })?.response?.status;

      // Some deployments may not expose an admin projects route. Fall back to the
      // standard endpoint only when the admin route is missing.
      if (httpStatus === 404) {
        try {
          const fallbackEndpoint = buildProjectsEndpoint("/projects", status);
          const response = await apiClient.get(fallbackEndpoint);
          return { success: true, data: unwrapApiData<Project[]>(response.data) };
        } catch (fallbackError: unknown) {
          return {
            success: false,
            error: getProjectApiErrorMessage(fallbackError, "Failed to fetch projects"),
          };
        }
      }

      return {
        success: false,
        error: getProjectApiErrorMessage(error, "Failed to fetch projects"),
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Project>> => {
    try {
      const response = await apiClient.get(`/projects/${id}`);
      return { success: true, data: unwrapApiData<Project>(response.data) };
    } catch (error: unknown) {
      return {
        success: false,
        error: getProjectApiErrorMessage(error, "Failed to fetch project"),
      };
    }
  },

  create: async (payload: CreateProjectPayload): Promise<ApiResponse<Project>> => {
    try {
      const response = await apiClient.post("/projects", payload);
      return { success: true, data: unwrapApiData<Project>(response.data) };
    } catch (error: unknown) {
      return {
        success: false,
        error: getProjectApiErrorMessage(error, "Failed to create project"),
      };
    }
  },

  update: async (id: string, payload: Partial<CreateProjectPayload>): Promise<ApiResponse<Project>> => {
    try {
      const response = await apiClient.put(`/projects/${id}`, payload);
      return { success: true, data: unwrapApiData<Project>(response.data) };
    } catch (error: unknown) {
      return {
        success: false,
        error: getProjectApiErrorMessage(error, "Failed to update project"),
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      await apiClient.delete(`/projects/${id}`);
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: getProjectApiErrorMessage(error, "Failed to delete project"),
      };
    }
  },
};
