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
  FolderKanban,
  Calendar,
  Clock,
  Timer,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { tasksApi } from "@/lib/api/tasks";
import { projectsApi } from "@/lib/api/projects";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskForm } from "@/components/tasks/task-form";
import { toast } from "@/components/ui/sonner";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const { data: taskData, isLoading: taskLoading, error } = useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksApi.getById(id),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects", isAdmin ? "admin" : "user"],
    queryFn: () => (isAdmin ? projectsApi.getAllAdmin() : projectsApi.getAll()),
  });

  const { data: projectData } = useQuery({
    queryKey: ["project", taskData?.data?.project_id],
    queryFn: () => projectsApi.getById(taskData?.data?.project_id || ""),
    enabled: !!taskData?.data?.project_id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof tasksApi.update>[1]) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated successfully");
      setShowEditDialog(false);
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
      router.push("/tasks");
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditSubmit = (data: any) => {
    const payload = {
      ...data,
      estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : undefined,
      actual_hours: data.actual_hours ? Number(data.actual_hours) : undefined,
      start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : undefined,
      due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : undefined,
    };
    updateMutation.mutate(payload);
  };

  if (taskLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tasks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <CardSkeleton className="flex-1 h-16" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CardSkeleton className="h-64" />
          </div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !taskData?.success || !taskData.data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Failed to load task</p>
        <Button asChild>
          <Link href="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  const task = taskData.data;
  const project = projectData?.data;
  const projects = projectsData?.data || [];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

  const detailItems = [
    { icon: Calendar, label: "Start Date", value: task.start_date ? format(new Date(task.start_date), "MMM d, yyyy") : null },
    { icon: Calendar, label: "Due Date", value: task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : null, isOverdue },
    { icon: Clock, label: "Estimated Hours", value: task.estimated_hours ? `${task.estimated_hours}h` : null },
    { icon: Timer, label: "Actual Hours", value: task.actual_hours ? `${task.actual_hours}h` : null },
  ].filter(item => item.value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tasks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>
            {project && (
              <Link
                href={`/projects/${project.id}`}
                className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1"
              >
                <FolderKanban className="h-3.5 w-3.5" />
                {project.name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {project && (
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}`}>
                    <FolderKanban className="mr-2 h-4 w-4" />
                    View Project
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              ) : (
                <p className="text-muted-foreground italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Time Tracking */}
          {(task.estimated_hours || task.actual_hours) && (
            <Card>
              <CardHeader>
                <CardTitle>Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {task.estimated_hours && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Estimated</p>
                      <p className="text-2xl font-bold">{task.estimated_hours}h</p>
                    </div>
                  )}
                  {task.actual_hours && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Actual</p>
                      <p className="text-2xl font-bold">{task.actual_hours}h</p>
                    </div>
                  )}
                </div>
                {task.estimated_hours && task.actual_hours && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Variance</span>
                      <span className={task.actual_hours > task.estimated_hours ? "text-destructive" : "text-green-600"}>
                        {task.actual_hours > task.estimated_hours ? "+" : ""}
                        {(task.actual_hours - task.estimated_hours).toFixed(1)}h
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailItems.length > 0 ? (
                detailItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <item.icon className={`h-4 w-4 ${item.isOverdue ? "text-destructive" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-sm font-medium ${item.isOverdue ? "text-destructive" : ""}`}>
                        {item.value}
                        {item.isOverdue && " (Overdue)"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No additional details available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Related Project */}
          {project && (
            <Card>
              <CardHeader>
                <CardTitle>Project</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {project.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            task={task}
            projects={projects}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditDialog(false)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
