"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Plus,
  Search,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  MapPin,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { projectsApi } from "@/lib/api/projects";
import { useAuthStore } from "@/lib/stores/auth-store";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import { getTaskMetrics, sortTasksByExecutionOrder } from "@/components/projects/project-workflow";
import type { Project, ProjectStatus } from "@/lib/types";

const statusOptions: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
];

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const router = useRouter();
  const tasks = sortTasksByExecutionOrder(Array.isArray(project.tasks) ? project.tasks : []);
  const metrics = getTaskMetrics(tasks);

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/projects/${project.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/projects/${project.id}`);
        }
      }}
      className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-indigo-300/40"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-indigo-500/15 to-purple-500/10 opacity-60" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                <Link
                  href={`/projects/${project.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {project.name}
                </Link>
              </CardTitle>
              <CardDescription className="text-xs capitalize">
                {project.type.replace(/_/g, " ")}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(project.id)}
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
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {project.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[150px]">{project.location}</span>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span>${project.budget.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <StatusBadge status={project.status} />
          {project.start_date && (
            <span className="text-xs text-muted-foreground">
              Started {format(new Date(project.start_date), "MMM d, yyyy")}
            </span>
          )}
        </div>
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{metrics.progress}%</span>
          </div>
          <Progress value={metrics.progress} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{metrics.total} tasks</span>
            <span>{metrics.completed} completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", isAdmin ? "admin" : "user", statusFilter],
    queryFn: () => {
      const resolvedStatus = statusFilter === "all" ? undefined : statusFilter;
      return isAdmin ? projectsApi.getAllAdmin(resolvedStatus) : projectsApi.getAll(resolvedStatus);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  const projects = Array.isArray(data?.data) ? data.data : [];
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load projects</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your construction projects
          </p>
        </div>
        {!isAdmin && (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ProjectStatus | "all")}
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
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={FolderKanban}
              title={search ? "No matching projects" : "No projects yet"}
              description={
                search
                  ? "Try adjusting your search or filters"
                  : isAdmin
                    ? "No projects available"
                    : "Create your first project to get started with Yojak AI"
              }
              action={
                !search && !isAdmin && (
                  <Button asChild>
                    <Link href="/projects/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Project
                    </Link>
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will remove all associated data."
        confirmText="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
