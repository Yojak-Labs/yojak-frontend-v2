"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Plus,
  Search,
  CheckSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Clock,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tasksApi } from "@/lib/api/tasks";
import { projectsApi } from "@/lib/api/projects";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskForm } from "@/components/tasks/task-form";
import { toast } from "@/components/ui/sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Task, TaskStatus } from "@/lib/types";

const statusOptions: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

function TaskCard({
  task,
  projectName,
  onEdit,
  onDelete,
}: {
  task: Task;
  projectName?: string;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

  return (
    <Card className={`group hover:shadow-md transition-shadow ${isOverdue ? "border-destructive/50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CheckSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">
                <Link
                  href={`/tasks/${task.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {task.title}
                </Link>
              </CardTitle>
              {projectName && (
                <p className="text-xs text-muted-foreground truncate">
                  {projectName}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tasks/${task.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
        </div>

        {(task.due_date || task.estimated_hours) && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground pt-2 border-t">
            {task.due_date && (
              <div className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
                <Clock className="h-3.5 w-3.5" />
                <span>Due {format(new Date(task.due_date), "MMM d")}</span>
              </div>
            )}
            {task.estimated_hours && (
              <span>{task.estimated_hours}h estimated</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskListItem({
  task,
  projectName,
  onEdit,
  onDelete,
}: {
  task: Task;
  projectName?: string;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

  return (
    <div className={`flex items-center gap-4 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors ${isOverdue ? "bg-destructive/5" : ""}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <CheckSquare className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/tasks/${task.id}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {task.title}
        </Link>
        {projectName && (
          <p className="text-xs text-muted-foreground truncate">{projectName}</p>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>
      {task.due_date && (
        <span className={`hidden md:block text-sm ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
          {format(new Date(task.due_date), "MMM d")}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/tasks/${task.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(task.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const currentUserId = user?.id;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Get default project from URL
  const defaultProjectId = searchParams.get("projectId");

  useEffect(() => {
    if (defaultProjectId && !isAdmin) {
      setProjectFilter(defaultProjectId);
      setShowCreateDialog(true);
    }
  }, [defaultProjectId, isAdmin]);

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", statusFilter, projectFilter],
    queryFn: () =>
      tasksApi.getAll({
        status: statusFilter === "all" ? undefined : statusFilter,
        projectId: projectFilter === "all" ? undefined : projectFilter,
      }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
      setShowCreateDialog(false);
      // Clear URL param
      if (defaultProjectId) {
        router.push("/tasks");
      }
    },
    onError: () => {
      toast.error("Failed to create task");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof tasksApi.update>[1] }) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated successfully");
      setEditTask(null);
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });

  const tasks = tasksData?.data || [];
  const projects = projectsData?.data || [];
  const getProjectOwnerId = (project: { userId?: string }) => {
    const projectRecord = project as unknown as Record<string, unknown>;
    const ownerId =
      project.userId ||
      (typeof projectRecord.user_id === "string" ? projectRecord.user_id : undefined) ||
      (typeof projectRecord.ownerId === "string" ? projectRecord.ownerId : undefined) ||
      (typeof projectRecord.owner_id === "string" ? projectRecord.owner_id : undefined);
    return ownerId?.trim();
  };
  const visibleProjects = isAdmin
    ? projects
    : projects.filter((project) => {
        const ownerId = getProjectOwnerId(project);
        return !!currentUserId && !!ownerId && ownerId === currentUserId;
      });
  const visibleProjectIds = new Set(visibleProjects.map((project) => project.id));
  const visibleTasks = isAdmin
    ? tasks
    : tasks.filter((task) => visibleProjectIds.has(task.project_id));
  const projectsMap = new Map(visibleProjects.map((p) => [p.id, p.name]));

  const filteredTasks = visibleTasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateSubmit = (data: any) => {
    if (isAdmin) {
      toast.error("Admins cannot create tasks");
      setShowCreateDialog(false);
      return;
    }
    const payload = {
      ...data,
      estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : undefined,
      actual_hours: data.actual_hours ? Number(data.actual_hours) : undefined,
      start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : undefined,
      due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : undefined,
    };
    createMutation.mutate(payload);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditSubmit = (data: any) => {
    if (!editTask) return;
    const payload = {
      ...data,
      estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : undefined,
      actual_hours: data.actual_hours ? Number(data.actual_hours) : undefined,
      start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : undefined,
      due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : undefined,
    };
    updateMutation.mutate({ id: editTask.id, data: payload });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track your project tasks
          </p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {visibleProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {tasksLoading ? (
        <TableSkeleton rows={6} />
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={CheckSquare}
              title={search ? "No matching tasks" : "No tasks yet"}
              description={
                search
                  ? "Try adjusting your search or filters"
                  : isAdmin
                    ? "No tasks available"
                    : "Create your first task to start managing your work"
              }
              action={
                !search && !isAdmin && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectName={projectsMap.get(task.project_id)}
              onEdit={setEditTask}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredTasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                projectName={projectsMap.get(task.project_id)}
                onEdit={setEditTask}
                onDelete={setDeleteId}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      {!isAdmin && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to your project
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              projects={visibleProjects}
              defaultProjectId={defaultProjectId || undefined}
              onSubmit={handleCreateSubmit}
              onCancel={() => setShowCreateDialog(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTask} onOpenChange={(open) => !open && setEditTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details
            </DialogDescription>
          </DialogHeader>
          {editTask && (
            <TaskForm
              task={editTask}
              projects={visibleProjects}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditTask(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
