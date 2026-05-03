// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  role: "admin" | "user";
  status?: AccountStatus;
  contact?: string;
  phone?: string;
  userType?: "student" | "professional";
  college?: string | null;
  company?: string | null;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  userId: string;
  role: "admin" | "user";
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userType: "student" | "professional";
  college: string | null;
  company: string | null;
  emailVerified: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  userType: "student" | "professional";
  college?: string | null;
  company?: string | null;
}

export type AccountStatus = "active" | "deactive";

// Project types
export type ProjectStatus = "planned" | "in_progress" | "completed" | "on_hold" | "cancelled";
export type ProjectType = "residential" | "commercial" | "industrial" | "infrastructure";

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: ProjectType;
  location?: string;
  budget?: number;
  area_sq_ft?: number;
  floors?: number;
  start_date?: string;
  end_date?: string;
  requirements?: string;
  status: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  type: ProjectType;
  location?: string;
  budget?: number;
  area_sq_ft?: number;
  floors?: number;
  start_date?: string;
  end_date?: string;
  requirements?: string;
  status?: ProjectStatus;
}

// Task types
export type TaskStatus = "pending" | "in_progress" | "completed" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  dependencies?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskPayload {
  project_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  dependencies?: string[];
}

// Admin types
export interface Admin {
  id: string;
  email: string;
  name: string;
  role: "admin";
  status?: AccountStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminPayload {
  email: string;
  password: string;
  name: string;
}

// Agent types
export type AgentConfiguration = Record<string, unknown>;

export interface AgentTool {
  id: string;
  source: string;
  sourceId: string;
  name: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  userPrompt: string;
  systemPrompt: string;
  configuration: AgentConfiguration;
  tools: AgentTool[];
  createdAt?: string;
  updatedAt?: string;

  // Backwards-compatible fields (older API versions)
  type?: string;
  capabilities?: string[];
  status?: "active" | "inactive";
}

export interface CreateAgentPayload {
  name: string;
  description: string;
  model: string;
  userPrompt: string;
  systemPrompt: string;
  configuration: AgentConfiguration;
  tools: AgentTool[];
}

// Tool types
export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateToolPayload {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
