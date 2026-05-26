import type { Task, TaskStatus } from "@/lib/types";

const STATUS_REQUIRES_COMPLETED_DEPS: TaskStatus[] = ["in_progress", "done"];

export const resolveDependencies = (task: Task, tasksById: Map<string, Task>) => {
  const resolved: Task[] = [];
  const missing: string[] = [];

  for (const dependencyId of task.dependencies ?? []) {
    const dependency = tasksById.get(dependencyId);
    if (dependency) {
      resolved.push(dependency);
    } else {
      missing.push(dependencyId);
    }
  }

  return { resolved, missing };
};

export const getIncompleteDependencies = (task: Task, tasksById: Map<string, Task>) =>
  resolveDependencies(task, tasksById).resolved.filter((dependency) => dependency.status !== "done");

export const isDependencyBlocked = (task: Task, tasksById: Map<string, Task>) =>
  getIncompleteDependencies(task, tasksById).length > 0;

export const canUpdateTaskStatus = (
  task: Task,
  nextStatus: TaskStatus,
  tasksById: Map<string, Task>
) => {
  if (!STATUS_REQUIRES_COMPLETED_DEPS.includes(nextStatus)) {
    return true;
  }
  return !isDependencyBlocked(task, tasksById);
};

export const getStatusUpdateBlockReason = (
  task: Task,
  nextStatus: TaskStatus,
  tasksById: Map<string, Task>
) => {
  if (canUpdateTaskStatus(task, nextStatus, tasksById)) {
    return null;
  }

  const incomplete = getIncompleteDependencies(task, tasksById);
  if (!incomplete.length) {
    return "Complete prerequisite tasks before updating this status.";
  }

  const labels = incomplete
    .map((dependency) => `#${dependency.execution_order ?? "-"} ${dependency.title}`)
    .join(", ");

  return `Complete prerequisite task(s) first: ${labels}`;
};

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];
