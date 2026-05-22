import { apiClient, unwrapApiData } from "@/lib/api/client";
import type {
  MaterialCostRecord,
  OrchestrationPayload,
  ProjectRunAgentResponse,
  RiskReportRecord,
} from "./types";

const asErrorMessage = (error: unknown, fallback: string) => {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
};

const parseJSONIfString = <T,>(value: unknown, fallback: T): T => {
  if (typeof value !== "string") return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const extractEnvelopeData = <T,>(payload: unknown): T[] => {
  const unwrapped = unwrapApiData<unknown>(payload);
  if (Array.isArray(unwrapped)) return unwrapped as T[];
  if (unwrapped && typeof unwrapped === "object" && "data" in (unwrapped as Record<string, unknown>)) {
    const nested = (unwrapped as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as T[];
  }
  return [];
};

const normalizeRunAgentResponse = (payload: unknown): ProjectRunAgentResponse => {
  const data = unwrapApiData<unknown>(payload) as
    | {
        project_id?: string;
        message?: string;
        status?: string;
        data?: unknown;
      }
    | undefined;

  return {
    project_id: data?.project_id || "",
    message: data?.message || "",
    status: data?.status || "",
    data: parseJSONIfString<OrchestrationPayload | undefined>(data?.data, undefined),
  };
};

const normalizeRiskRecord = (payload: unknown): RiskReportRecord => {
  const source = payload as {
    id?: string;
    project_id?: string;
    owner_id?: string;
    version?: string;
    report?: unknown;
  };

  return {
    id: source.id || "",
    project_id: source.project_id || "",
    owner_id: source.owner_id || "",
    version: source.version || "",
    report: parseJSONIfString(source.report, {}),
  };
};

const normalizeMaterialRecord = (payload: unknown): MaterialCostRecord => {
  const source = payload as {
    id?: string;
    project_id?: string;
    owner_id?: string;
    version?: string;
    report?: unknown;
  };

  return {
    id: source.id || "",
    project_id: source.project_id || "",
    owner_id: source.owner_id || "",
    version: source.version || "",
    report: parseJSONIfString(source.report, { tasks: [] }),
  };
};

export const projectGenerationApi = {
  runAgent: async (projectId: string): Promise<ProjectRunAgentResponse> => {
    const response = await apiClient.post(`/projects/run-agent/${projectId}`);
    return normalizeRunAgentResponse(response.data);
  },

  getRiskReports: async (projectId: string): Promise<RiskReportRecord[]> => {
    const response = await apiClient.get("/risk-reports", { params: { project_id: projectId } });
    return extractEnvelopeData<unknown>(response.data).map(normalizeRiskRecord);
  },

  getMaterialReports: async (projectId: string): Promise<MaterialCostRecord[]> => {
    const response = await apiClient.get("/material-cost-reports", { params: { project_id: projectId } });
    return extractEnvelopeData<unknown>(response.data).map(normalizeMaterialRecord);
  },
};

export { asErrorMessage };
