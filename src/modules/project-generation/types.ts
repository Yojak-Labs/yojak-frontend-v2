export type StageKey = "a1" | "a2" | "a3" | "a4" | "a5" | "a6" | "a7";

export type StageState = "pending" | "running" | "completed" | "failed";

export interface PipelineStage {
  key: StageKey;
  title: string;
  description: string;
  state: StageState;
}

export interface PlannerTask {
  title: string;
  description?: string;
  status: string;
  priority: string;
  task_temp_id?: string;
  dependencies?: string[];
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
}

export interface PlannerResponse {
  tasks: PlannerTask[];
}

export interface ScheduledTask {
  id: string;
  title: string;
  status?: string;
  priority?: string;
  execution_order: number;
  start_offset: number;
  end_offset: number;
  dependencies?: string[];
}

export interface ScheduleExecutionStage {
  stage: number;
  task_ids: string[];
  titles?: string[];
}

export interface ScheduleResponse {
  project_id: string;
  tasks: ScheduledTask[];
  topological_order?: string[];
  execution_stages: ScheduleExecutionStage[];
  critical_path: string[];
  total_projected_duration: number;
}

export interface RiskTaskAnalysis {
  task_id: string;
  task_title: string;
  risk_score: number;
  risk_level: string;
  delay_probability: number;
  reasons: string[];
  mitigation_strategies: string[];
}

export interface RiskReport {
  overall_project_risk: number;
  delay_probability: number;
  tasks: RiskTaskAnalysis[];
}

export interface MaterialOption {
  name: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  brand?: string;
  description?: string;
}

export interface MaterialTier {
  basic: MaterialOption[];
  good: MaterialOption[];
  premium: MaterialOption[];
}

export interface TaskMaterialEstimate {
  task_title: string;
  tiers: MaterialTier;
}

export interface MaterialCostReportData {
  tasks: TaskMaterialEstimate[];
}

export interface DiagramDownloadUrls {
  svg?: string;
  png?: string;
  pdf?: string;
}

export interface DiagramResult {
  layout_json?: unknown;
  svg?: string;
  image_url?: string;
  download_urls?: DiagramDownloadUrls;
}

export interface OrchestrationPayload {
  planner?: PlannerResponse;
  schedule?: ScheduleResponse;
  risk_report?: RiskReport;
  risk_narrative?: unknown;
  diagram?: DiagramResult;
  design_spec?: unknown;
  orchestration_ok?: boolean;
  project_id?: string;
}

export interface ProjectRunAgentResponse {
  project_id: string;
  message: string;
  status: string;
  data?: OrchestrationPayload;
}

export interface RiskReportRecordEnvelope {
  project_id?: string;
  risk_report?: RiskReport;
  risk_narrative?: unknown;
}

export interface RiskReportRecord {
  id: string;
  project_id: string;
  owner_id: string;
  version: string;
  report: RiskReportRecordEnvelope;
}

export interface MaterialCostRecord {
  id: string;
  project_id: string;
  owner_id: string;
  version: string;
  report: MaterialCostReportData;
}
