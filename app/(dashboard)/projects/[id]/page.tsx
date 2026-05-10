"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  DollarSign,
  Building,
  Layers,
  Calendar,
  MoreHorizontal,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectsApi } from "@/lib/api/projects";
import { tasksApi } from "@/lib/api/tasks";
import { useAuthStore } from "@/lib/stores/auth-store";
import { StatusBadge } from "@/components/ui/status-badge";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskForm } from "@/components/tasks/task-form";
import { toast } from "@/components/ui/sonner";
import {
  ProjectExecutionTimeline,
  ProjectKanban,
  ProjectWorkflowSummary,
  getTaskEndDate,
  getTaskMetrics,
  sortTasksByExecutionOrder,
} from "@/components/projects/project-workflow";
import type { Task } from "@/lib/types";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: projectData, isLoading: projectLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getById(id),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["project-tasks", id],
    queryFn: () => tasksApi.getByProject(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
      router.push("/projects");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Parameters<typeof tasksApi.update>[1] }) =>
      tasksApi.update(taskId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
      toast.success("Task updated successfully");
      setEditingTask(null);
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <CardSkeleton className="h-16 flex-1" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !projectData?.success || !projectData.data) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-destructive">{projectData?.error || "Failed to load project"}</p>
        <Button asChild>
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const project = projectData.data;
  const preloadedTasks = Array.isArray(project.tasks) ? project.tasks : [];
  const tasks = sortTasksByExecutionOrder(
    Array.isArray(tasksData?.data) ? tasksData.data : preloadedTasks
  ).filter((task) => task.project_id === project.id);
  const metrics = getTaskMetrics(tasks);

  const detailItems = [
    { icon: MapPin, label: "Location", value: project.location },
    { icon: DollarSign, label: "Budget", value: project.budget ? `$${project.budget.toLocaleString()}` : null },
    { icon: Building, label: "Area", value: project.area_sq_ft ? `${project.area_sq_ft.toLocaleString()} sq ft` : null },
    { icon: Layers, label: "Floors", value: project.floors },
    { icon: Calendar, label: "Start", value: project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : null },
    { icon: Calendar, label: "End", value: project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : null },
  ].filter((item) => item.value);

  const handleEditSubmit = (data: {
    title: string;
    description?: string;
    status: Task["status"];
    priority: Task["priority"];
    start_date?: Date;
    end_date?: Date;
    estimated_hours?: number | "";
  }) => {
    if (!editingTask) return;
    updateTaskMutation.mutate({
      taskId: editingTask.id,
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : undefined,
        start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : undefined,
        end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : undefined,
        due_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-muted-foreground capitalize">
              {project.type.replace(/_/g, " ")} execution workspace
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <ClipboardList className="mr-2 h-4 w-4" />
                Tasks are managed here
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.progress}%</p>
            <p className="text-xs text-muted-foreground">{metrics.completed} of {metrics.total} tasks complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.total}</p>
            <p className="text-xs text-muted-foreground">Project-scoped workflow items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.inProgress}</p>
            <p className="text-xs text-muted-foreground">Currently in execution</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.blocked}</p>
            <p className="text-xs text-muted-foreground">Needs dependency completion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>Scope, requirements, and execution context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
              ) : (
                <p className="text-sm italic text-muted-foreground">No description provided.</p>
              )}
              {project.requirements && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm font-semibold">Requirements</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {tasksLoading ? (
            <CardSkeleton />
          ) : tasks.length ? (
            <>
              <ProjectExecutionTimeline tasks={tasks} onEditTask={isAdmin ? undefined : setEditingTask} />
              <ProjectKanban tasks={tasks} onEditTask={isAdmin ? undefined : setEditingTask} />
            </>
          ) : (
            <Card>
              <CardContent className="py-0">
                <EmptyState
                  icon={ClipboardList}
                  title="No workflow tasks"
                  description="Planner-generated project tasks will appear here in execution_order sequence."
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <ProjectWorkflowSummary tasks={tasks} />

          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailItems.length ? (
                detailItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No additional details available.</p>
              )}
            </CardContent>
          </Card>

          {tasks.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Ordered Task List</CardTitle>
                <CardDescription>Strict execution_order ascending.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.map((task) => {
                  const endDate = getTaskEndDate(task);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => !isAdmin && setEditingTask(task)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          #{task.execution_order ?? "-"} {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {task.estimated_hours ? `${task.estimated_hours}h` : "No estimate"}
                          {endDate ? ` • Ends ${format(new Date(endDate), "MMM d")}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={task.status} />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update user-controlled planning fields without changing workflow order or dependencies.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              task={editingTask}
              projects={[project]}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingTask(null)}
              isLoading={updateTaskMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will remove associated workflow tasks."
        confirmText="Delete"
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
