"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { tasksApi } from "@/lib/api/tasks";
import { canUpdateTaskStatus } from "@/lib/tasks/task-dependencies";
import { toast } from "@/components/ui/sonner";
import type { TaskStatus } from "@/lib/types";
import { projectGenerationApi, asErrorMessage } from "../api";
import type {
  MaterialCostReportData,
  OrchestrationPayload,
  PipelineStage,
  RiskReport,
  StageState,
} from "../types";

const defaultStages: PipelineStage[] = [
  {
    key: "a1",
    title: "Rules & Regulations",
    description: "Validating compliance and constraints",
    state: "pending",
  },
  {
    key: "a2",
    title: "Planner Agent",
    description: "Generating dependency-aware task graph",
    state: "pending",
  },
  {
    key: "a3",
    title: "Resource Agent",
    description: "Compiling design specification",
    state: "pending",
  },
  {
    key: "a4",
    title: "Material Agent",
    description: "Building tiered material and cost estimates",
    state: "pending",
  },
  {
    key: "a5",
    title: "Scheduling Engine",
    description: "Calculating stages and critical path",
    state: "pending",
  },
  {
    key: "a6",
    title: "Risk Agent",
    description: "Scoring delay probability and mitigation plans",
    state: "pending",
  },
  {
    key: "a7",
    title: "Diagram Agent",
    description: "Rendering deterministic site layout artifacts",
    state: "pending",
  },
];

const getStageState = (index: number, completionIndex: number, failed: boolean): StageState => {
  if (failed && index >= completionIndex) return "failed";
  if (index < completionIndex) return "completed";
  if (index === completionIndex && completionIndex < defaultStages.length) return "running";
  return "pending";
};

export function useProjectGeneration(projectId: string, options?: { autoStart?: boolean }) {
  const queryClient = useQueryClient();
  const [runTriggered, setRunTriggered] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const autoStartAttemptedRef = useRef(false);
  const [orchestrationData, setOrchestrationData] = useState<OrchestrationPayload | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(`project-generation:${projectId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as OrchestrationPayload;
    } catch {
      return null;
    }
  });
  const hasCachedOrchestration = Boolean(orchestrationData);

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getById(projectId),
    refetchInterval: runTriggered ? 6000 : false,
  });

  const tasksQuery = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: () => tasksApi.getByProject(projectId),
    refetchInterval: runTriggered ? 5000 : false,
  });

  const riskQuery = useQuery({
    queryKey: ["risk-reports", projectId],
    queryFn: () => projectGenerationApi.getRiskReports(projectId),
    enabled: runTriggered,
    refetchInterval: runTriggered ? 7000 : false,
  });

  const materialQuery = useQuery({
    queryKey: ["material-reports", projectId],
    queryFn: () => projectGenerationApi.getMaterialReports(projectId),
    enabled: runTriggered,
    refetchInterval: runTriggered ? 7000 : false,
  });

  const runMutation = useMutation({
    mutationFn: () => projectGenerationApi.runAgent(projectId),
    onMutate: () => {
      setRunTriggered(true);
      setRunError(null);
    },
    onSuccess: (response) => {
      setOrchestrationData(response.data ?? null);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["risk-reports", projectId] });
      queryClient.invalidateQueries({ queryKey: ["material-reports", projectId] });
    },
    onError: (error) => {
      setRunError(asErrorMessage(error, "Failed to run generation workflow"));
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const response = await tasksApi.update(taskId, { status });
      if (!response.success) {
        throw new Error(response.error || "Failed to update task status");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast.success("Task status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update task status");
    },
  });

  const startGeneration = () => {
    if (runMutation.isPending) return;
    runMutation.mutate();
  };

  useEffect(() => {
    if (hasCachedOrchestration) {
      setRunTriggered(true);
    }
  }, [hasCachedOrchestration]);

  useEffect(() => {
    if (!options?.autoStart || autoStartAttemptedRef.current || hasCachedOrchestration) return;
    autoStartAttemptedRef.current = true;
    runMutation.mutate();
  }, [options?.autoStart, hasCachedOrchestration, runMutation]);

  useEffect(() => {
    if (!orchestrationData || typeof window === "undefined") return;
    window.sessionStorage.setItem(`project-generation:${projectId}`, JSON.stringify(orchestrationData));
  }, [orchestrationData, projectId]);

  const tasks = tasksQuery.data?.data || [];
  const tasksById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks]
  );

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const task = tasksById.get(taskId);
    if (!task) return;

    if (!canUpdateTaskStatus(task, status, tasksById)) {
      toast.error("Complete prerequisite tasks before updating to In Progress or Done.");
      return;
    }

    updateTaskStatusMutation.mutate({ taskId, status });
  };

  const riskReport = useMemo((): RiskReport | null => {
    if (orchestrationData?.risk_report) return orchestrationData.risk_report;
    const latest = riskQuery.data?.[0];
    return latest?.report?.risk_report || null;
  }, [orchestrationData, riskQuery.data]);

  const materialReport = useMemo((): MaterialCostReportData | null => {
    const latest = materialQuery.data?.[0];
    return latest?.report || null;
  }, [materialQuery.data]);

  const stages = useMemo(() => {
    const hasTasks = tasks.length > 0;
    const hasPlanner = Boolean(orchestrationData?.planner) || hasTasks;
    const hasDesign = Boolean(orchestrationData?.design_spec);
    const hasMaterials = Boolean(materialReport?.tasks?.length);
    const hasSchedule = Boolean(orchestrationData?.schedule) || hasTasks;
    const hasRisk = Boolean(riskReport);
    const hasDiagram = Boolean(orchestrationData?.diagram?.svg);

    const checkpoints = [true, hasPlanner, hasDesign, hasMaterials, hasSchedule, hasRisk, hasDiagram];
    let completionIndex = checkpoints.findIndex((value) => !value);
    if (completionIndex === -1) completionIndex = defaultStages.length;
    const failed = Boolean(runError);

    return defaultStages.map((stage, index) => ({
      ...stage,
      state: getStageState(index, completionIndex, failed),
    }));
  }, [materialReport, orchestrationData, riskReport, runError, tasks.length]);

  const completion = useMemo(() => {
    const completed = stages.filter((stage) => stage.state === "completed").length;
    return Math.round((completed / stages.length) * 100);
  }, [stages]);

  return {
    projectQuery,
    tasksQuery,
    riskQuery,
    materialQuery,
    orchestrationData,
    stages,
    completion,
    runTriggered,
    runError,
    riskReport,
    materialReport,
    isRunning: runMutation.isPending,
    tasks,
    updateTaskStatus,
    updatingTaskId: updateTaskStatusMutation.isPending
      ? updateTaskStatusMutation.variables?.taskId ?? null
      : null,
    startGeneration,
    hasStarted: runTriggered || hasCachedOrchestration,
  };
}
