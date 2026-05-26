"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  GitBranch,
  Loader2,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { getTaskEndDate, sortTasksByExecutionOrder } from "@/components/projects/project-workflow";
import {
  TASK_STATUS_OPTIONS,
  canUpdateTaskStatus,
  getIncompleteDependencies,
  getStatusUpdateBlockReason,
  isDependencyBlocked,
  resolveDependencies,
} from "@/lib/tasks/task-dependencies";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";

const formatDate = (value?: string) => {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy");
};

type TaskReadiness = "ready" | "blocked" | "completed";

const getTaskReadiness = (task: Task, tasksById: Map<string, Task>): TaskReadiness => {
  if (task.status === "done") return "completed";
  if (task.status === "blocked" || isDependencyBlocked(task, tasksById)) return "blocked";
  return "ready";
};

const readinessMeta: Record<
  TaskReadiness,
  { label: string; message: string; className: string; icon: typeof CheckCircle2 }
> = {
  ready: {
    label: "Ready",
    message: "Dependencies are satisfied. This task can be executed now.",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  blocked: {
    label: "Blocked",
    message: "This task must wait until prerequisite tasks are completed.",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
    icon: Lock,
  },
  completed: {
    label: "Completed",
    message: "This task has been completed.",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    icon: CheckCircle2,
  },
};

function DependencyList({
  task,
  tasksById,
}: {
  task: Task;
  tasksById: Map<string, Task>;
}) {
  const { resolved, missing } = resolveDependencies(task, tasksById);

  if (!resolved.length && !missing.length) {
    return <p className="text-xs text-muted-foreground">No upstream dependencies.</p>;
  }

  return (
    <div className="space-y-2">
      {resolved.map((dependency) => {
        const complete = dependency.status === "done";
        return (
          <div
            key={dependency.id}
            className={cn(
              "flex items-start justify-between gap-3 border px-3 py-2 text-xs",
              complete
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5"
            )}
          >
            <div className="min-w-0">
              <p className="font-medium">
                #{dependency.execution_order ?? "—"} {dependency.title}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Prerequisite task · {dependency.status.replace("_", " ")}
              </p>
            </div>
            <StatusBadge status={dependency.status} />
          </div>
        );
      })}

      {missing.map((dependencyId) => (
        <div
          key={dependencyId}
          className="flex items-start gap-2 border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <p className="font-medium">Unresolved dependency</p>
            <p className="text-[10px] opacity-80">{dependencyId}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskStatusControl({
  task,
  tasksById,
  updatingTaskId,
  onStatusChange,
}: {
  task: Task;
  tasksById: Map<string, Task>;
  updatingTaskId?: string | null;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}) {
  const [statusHint, setStatusHint] = useState<string | null>(null);
  const isUpdating = updatingTaskId === task.id;

  const handleChange = (value: string) => {
    const nextStatus = value as TaskStatus;
    if (nextStatus === task.status) return;

    const blockReason = getStatusUpdateBlockReason(task, nextStatus, tasksById);
    if (blockReason) {
      setStatusHint(blockReason);
      return;
    }

    setStatusHint(null);
    onStatusChange?.(task.id, nextStatus);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-[10px] uppercase text-muted-foreground">Update status</p>
        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
      </div>
      <Select value={task.status} onValueChange={handleChange} disabled={!onStatusChange || isUpdating}>
        <SelectTrigger className="h-8 w-full text-xs">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {TASK_STATUS_OPTIONS.map((option) => {
            const allowed = canUpdateTaskStatus(task, option.value, tasksById);
            return (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={!allowed}
                className="text-xs"
              >
                {option.label}
                {!allowed ? " (requires completed prerequisites)" : ""}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {statusHint ? (
        <p className="text-[11px] text-amber-800 dark:text-amber-200">{statusHint}</p>
      ) : null}
      {!canUpdateTaskStatus(task, "in_progress", tasksById) ? (
        <p className="text-[11px] text-muted-foreground">
          In Progress and Done are enabled only after all prerequisite tasks are completed.
        </p>
      ) : null}
    </div>
  );
}

function GenerationTaskRow({
  task,
  index,
  tasksById,
  isLast,
  updatingTaskId,
  onStatusChange,
}: {
  task: Task;
  index: number;
  tasksById: Map<string, Task>;
  isLast: boolean;
  updatingTaskId?: string | null;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}) {
  const endDate = getTaskEndDate(task);
  const incompleteDependencies = getIncompleteDependencies(task, tasksById);
  const dependencyBlocked = isDependencyBlocked(task, tasksById);
  const readiness = getTaskReadiness(task, tasksById);
  const meta = readinessMeta[readiness];
  const ReadinessIcon = meta.icon;
  const showBlockedBanner = dependencyBlocked && task.status !== "done";

  return (
    <div className="relative flex gap-4">
      <div className="flex w-10 shrink-0 flex-col items-center">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center border text-xs font-bold",
            readiness === "blocked"
              ? "border-amber-500/40 bg-amber-500/10 text-amber-800"
              : readiness === "completed"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800"
                : "border-primary/30 bg-primary/10 text-primary"
          )}
        >
          {task.execution_order ?? index + 1}
        </div>
        {!isLast ? <div className="mt-2 w-px flex-1 bg-border" /> : null}
      </div>

      <div className="mb-5 min-w-0 flex-1 border bg-background">
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Task {task.execution_order ?? index + 1}
              </p>
              <h3 className="text-sm font-semibold">{task.title}</h3>
              {task.description ? (
                <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
                  {task.description}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge status={dependencyBlocked && task.status !== "done" ? "blocked" : task.status} />
              <PriorityBadge priority={task.priority} />
              <Badge variant="outline" className={cn("gap-1 text-[10px]", meta.className)}>
                <ReadinessIcon className="h-3 w-3" />
                {meta.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border bg-muted/10 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Start date</p>
                <p className="mt-1 text-xs font-medium">{formatDate(task.start_date)}</p>
              </div>
              <div className="border bg-muted/10 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">End date</p>
                <p className="mt-1 text-xs font-medium">{formatDate(endDate)}</p>
              </div>
              <div className="border bg-muted/10 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Estimated</p>
                <p className="mt-1 text-xs font-medium">
                  {task.estimated_hours != null ? `${task.estimated_hours}h` : "—"}
                </p>
              </div>
              <div className="border bg-muted/10 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Actual</p>
                <p className="mt-1 text-xs font-medium">
                  {task.actual_hours != null ? `${task.actual_hours}h` : "—"}
                </p>
              </div>
            </div>

            <TaskStatusControl
              task={task}
              tasksById={tasksById}
              updatingTaskId={updatingTaskId}
              onStatusChange={onStatusChange}
            />

            <div className={cn("border px-3 py-2 text-xs", meta.className)}>
              <p className="font-medium">{meta.message}</p>
            </div>

            {showBlockedBanner ? (
              <div className="flex items-start gap-2 border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-xs text-amber-950 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Executable only after prerequisite tasks</p>
                  <p className="text-[11px] opacity-90">
                    Complete the following upstream tasks before starting this one:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {incompleteDependencies.map((dependency) => (
                      <li key={dependency.id} className="flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 bg-amber-600" />
                        <span>
                          #{dependency.execution_order ?? "—"} {dependency.title}
                        </span>
                        <StatusBadge status={dependency.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
              Dependency chain
            </div>
            <DependencyList task={task} tasksById={tasksById} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GenerationTasksSection({
  tasks,
  onStatusChange,
  updatingTaskId,
}: {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  updatingTaskId?: string | null;
}) {
  const ordered = sortTasksByExecutionOrder(tasks);
  const tasksById = useMemo(() => new Map(ordered.map((task) => [task.id, task])), [ordered]);

  const metrics = useMemo(() => {
    const completed = ordered.filter((task) => task.status === "done").length;
    const blockedByDeps = ordered.filter(
      (task) => task.status !== "done" && isDependencyBlocked(task, tasksById)
    ).length;
    const ready = ordered.filter(
      (task) => task.status !== "done" && !isDependencyBlocked(task, tasksById)
    ).length;

    return { total: ordered.length, completed, blockedByDeps, ready };
  }, [ordered, tasksById]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <div>
            <CardTitle className="text-sm">Generated Tasks</CardTitle>
            <CardDescription className="text-xs">
              Update task status when prerequisites are completed. In Progress and Done require all dependency tasks to be done.
            </CardDescription>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="border bg-muted/10 p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Total tasks</p>
            <p className="mt-1 text-lg font-semibold">{metrics.total}</p>
          </div>
          <div className="border bg-muted/10 p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Ready / active</p>
            <p className="mt-1 text-lg font-semibold">{metrics.ready}</p>
          </div>
          <div className="border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Blocked by deps</p>
            <p className="mt-1 text-lg font-semibold text-amber-800 dark:text-amber-200">
              {metrics.blockedByDeps}
            </p>
          </div>
          <div className="border bg-muted/10 p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Completed</p>
            <p className="mt-1 text-lg font-semibold">{metrics.completed}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-0">
          {ordered.map((task, index) => (
            <GenerationTaskRow
              key={task.id}
              task={task}
              index={index}
              tasksById={tasksById}
              isLast={index === ordered.length - 1}
              updatingTaskId={updatingTaskId}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
