"use client";

import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowDown,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  GitBranch,
  ListOrdered,
  PlayCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";

export const getTaskEndDate = (task: Task) => task.end_date || task.due_date;

export const sortTasksByExecutionOrder = (tasks: Task[]) =>
  [...tasks].sort((a, b) => {
    const left = a.execution_order ?? Number.MAX_SAFE_INTEGER;
    const right = b.execution_order ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });

export const getTaskMetrics = (tasks: Task[]) => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return { total, completed, inProgress, blocked, progress };
};

const statusColumns: { status: TaskStatus; label: string }[] = [
  { status: "pending", label: "Upcoming" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "completed", label: "Completed" },
];

const statusStyles: Record<TaskStatus, { icon: typeof Circle; className: string; rail: string }> = {
  completed: {
    icon: CheckCircle2,
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    rail: "bg-emerald-500",
  },
  in_progress: {
    icon: PlayCircle,
    className: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    rail: "bg-blue-500",
  },
  blocked: {
    icon: AlertTriangle,
    className: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
    rail: "bg-red-500",
  },
  pending: {
    icon: Circle,
    className: "border-muted bg-muted/50 text-muted-foreground",
    rail: "bg-muted-foreground/40",
  },
};

const groupByExecutionOrder = (tasks: Task[]) => {
  const groups = new Map<number | "unscheduled", Task[]>();
  sortTasksByExecutionOrder(tasks).forEach((task) => {
    const order = task.execution_order ?? "unscheduled";
    groups.set(order, [...(groups.get(order) || []), task]);
  });

  return Array.from(groups.entries()).map(([order, groupedTasks]) => ({
    order,
    tasks: groupedTasks,
  }));
};

const dependenciesAreComplete = (task: Task, tasksById: Map<string, Task>) => {
  if (!task.dependencies?.length) return true;
  return task.dependencies.every((dependencyId) => tasksById.get(dependencyId)?.status === "completed");
};

function WorkflowTaskCard({
  task,
  isDependencyBlocked,
  onEdit,
}: {
  task: Task;
  isDependencyBlocked: boolean;
  onEdit?: (task: Task) => void;
}) {
  const endDate = getTaskEndDate(task);
  const style = isDependencyBlocked ? statusStyles.blocked : statusStyles[task.status];

  return (
    <div className={cn("rounded-lg border p-3", style.className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">#{task.execution_order ?? "-"}</span>
            <p className="truncate text-sm font-semibold">{task.title}</p>
          </div>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs opacity-80">{task.description}</p>
          )}
        </div>
        {onEdit && (
          <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => onEdit(task)}>
            Edit
          </Button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={isDependencyBlocked ? "blocked" : task.status} />
        <PriorityBadge priority={task.priority} />
        {task.estimated_hours ? (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {task.estimated_hours}h
          </Badge>
        ) : null}
        {endDate ? (
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(endDate), "MMM d")}
          </Badge>
        ) : null}
        {task.dependencies?.length ? (
          <Badge variant="outline" className="gap-1">
            <GitBranch className="h-3 w-3" />
            {task.dependencies.length} deps
          </Badge>
        ) : null}
      </div>
      {isDependencyBlocked && (
        <p className="mt-2 text-xs font-medium">
          Blocked until all dependencies are completed.
        </p>
      )}
    </div>
  );
}

export function ProjectExecutionTimeline({
  tasks,
  onEditTask,
}: {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
}) {
  const orderedTasks = sortTasksByExecutionOrder(tasks);
  const groups = groupByExecutionOrder(orderedTasks);
  const tasksById = new Map(orderedTasks.map((task) => [task.id, task]));

  if (!tasks.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-primary" />
          <CardTitle>Execution Timeline</CardTitle>
        </div>
        <CardDescription>
          Tasks are grouped and displayed by execution_order ascending.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {groups.map((group, index) => {
            const isParallel = group.tasks.length > 1;
            return (
              <div key={String(group.order)} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 min-w-9 items-center justify-center rounded-lg border bg-background text-sm font-bold">
                    {group.order === "unscheduled" ? "-" : group.order}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {isParallel ? "Parallel execution group" : "Execution step"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "grid gap-3 pl-12",
                    isParallel ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                  )}
                >
                  {group.tasks.map((task) => (
                    <WorkflowTaskCard
                      key={task.id}
                      task={task}
                      isDependencyBlocked={!dependenciesAreComplete(task, tasksById)}
                      onEdit={onEditTask}
                    />
                  ))}
                </div>
                {index < groups.length - 1 && (
                  <div className="flex pl-4 text-muted-foreground">
                    <ArrowDown className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectKanban({
  tasks,
  onEditTask,
}: {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
}) {
  const orderedTasks = sortTasksByExecutionOrder(tasks);
  const tasksById = new Map(orderedTasks.map((task) => [task.id, task]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Board</CardTitle>
        <CardDescription>Each status column preserves execution_order ascending.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-4">
          {statusColumns.map((column) => {
            const columnTasks = orderedTasks.filter((task) => task.status === column.status);
            return (
              <div key={column.status} className="rounded-lg border bg-muted/20 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">{column.label}</p>
                  <Badge variant="secondary">{columnTasks.length}</Badge>
                </div>
                <div className="space-y-3">
                  {columnTasks.length ? (
                    columnTasks.map((task) => (
                      <WorkflowTaskCard
                        key={task.id}
                        task={task}
                        isDependencyBlocked={!dependenciesAreComplete(task, tasksById)}
                        onEdit={onEditTask}
                      />
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      No tasks in this stage.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectWorkflowSummary({ tasks }: { tasks: Task[] }) {
  const metrics = getTaskMetrics(tasks);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Health</CardTitle>
        <CardDescription>Progress is calculated from project-scoped tasks only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-semibold">{metrics.progress}%</span>
          </div>
          <Progress value={metrics.progress} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Tasks</p>
            <p className="text-xl font-bold">{metrics.total}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Completed</p>
            <p className="text-xl font-bold">{metrics.completed}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Active</p>
            <p className="text-xl font-bold">{metrics.inProgress}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Blocked</p>
            <p className="text-xl font-bold">{metrics.blocked}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
