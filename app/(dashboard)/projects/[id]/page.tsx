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
  CheckSquare,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/sonner";

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

  const { data: projectData, isLoading: projectLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getById(id),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks", { projectId: id }],
    queryFn: () => tasksApi.getAll({ projectId: id }),
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

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <CardSkeleton className="flex-1 h-16" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !projectData?.success || !projectData.data) {
    const queryError = error as
      | {
          response?: {
            data?: { message?: string; error?: { message?: string; detail?: string } };
          };
          message?: string;
        }
      | undefined;
    const errorMessage =
      projectData?.error ||
      queryError?.response?.data?.error?.message ||
      queryError?.response?.data?.error?.detail ||
      queryError?.response?.data?.message ||
      queryError?.message ||
      "Failed to load project";
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{errorMessage}</p>
        <Button asChild>
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const project = projectData.data;
  const tasks = tasksData?.data || [];

  const detailItems = [
    { icon: MapPin, label: "Location", value: project.location },
    { icon: DollarSign, label: "Budget", value: project.budget ? `$${project.budget.toLocaleString()}` : null },
    { icon: Building, label: "Area", value: project.area_sq_ft ? `${project.area_sq_ft.toLocaleString()} sq ft` : null },
    { icon: Layers, label: "Floors", value: project.floors },
    { icon: Calendar, label: "Start Date", value: project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : null },
    { icon: Calendar, label: "End Date", value: project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : null },
  ].filter(item => item.value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-muted-foreground capitalize">
              {project.type.replace(/_/g, " ")} Project
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tasks?projectId=${id}`}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  View All Tasks
                </Link>
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

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {project.requirements && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {project.requirements}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""} in this project
                </CardDescription>
              </div>
              {!isAdmin && (
                <Button size="sm" asChild>
                  <Link href={`/tasks?projectId=${id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title="No tasks yet"
                  description={
                    isAdmin
                      ? "No tasks are available for this project"
                      : "Create tasks to break down your project into manageable pieces"
                  }
                  action={
                    !isAdmin ? (
                      <Button size="sm" asChild>
                        <Link href={`/tasks?projectId=${id}`}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Task
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Due {format(new Date(task.due_date), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </Link>
                  ))}
                  {tasks.length > 5 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href={`/tasks?projectId=${id}`}>
                        View all {tasks.length} tasks
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailItems.length > 0 ? (
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
                <p className="text-sm text-muted-foreground">
                  No additional details available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Task Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Task Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {tasks.filter((t) => t.status === "completed").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">In Progress</span>
                <span className="font-medium">
                  {tasks.filter((t) => t.status === "in_progress").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">
                  {tasks.filter((t) => t.status === "pending").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will remove all associated tasks."
        confirmText="Delete"
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
