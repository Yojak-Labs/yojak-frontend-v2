"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  MapPin,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/lib/stores/auth-store";
import { projectsApi } from "@/lib/api/projects";
import { tasksApi } from "@/lib/api/tasks";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { getTaskMetrics, sortTasksByExecutionOrder } from "@/components/projects/project-workflow";
import type { Project, Task } from "@/lib/types";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

function ProjectDashboardCard({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) {
  const orderedTasks = sortTasksByExecutionOrder(tasks);
  const metrics = getTaskMetrics(orderedTasks);
  const nextTask = orderedTasks.find((task) => task.status !== "completed");

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <Card className="h-full transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{project.name}</CardTitle>
                <CardDescription className="truncate capitalize">
                  {project.location || project.type.replace(/_/g, " ")}
                </CardDescription>
              </div>
            </div>
            <StatusBadge status={project.status} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{metrics.progress}%</span>
            </div>
            <Progress value={metrics.progress} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Tasks</p>
              <p className="text-lg font-bold">{metrics.total}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Done</p>
              <p className="text-lg font-bold">{metrics.completed}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Blocked</p>
              <p className="text-lg font-bold">{metrics.blocked}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "No start"}
                {" - "}
                {project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : "No end"}
              </span>
            </div>
            {project.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{project.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium">Next in workflow</p>
              <p className="truncate text-muted-foreground">
                {nextTask ? `#${nextTask.execution_order ?? "-"} ${nextTask.title}` : "Workflow complete"}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", isAdmin ? "admin" : "user"],
    queryFn: () => (isAdmin ? projectsApi.getAllAdmin() : projectsApi.getAll()),
  });

  const projects = Array.isArray(projectsData?.data) ? projectsData.data : [];
  const taskQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ["project-tasks", project.id],
      queryFn: () => tasksApi.getByProject(project.id),
      enabled: !!project.id,
    })),
  });

  const taskMap = new Map(
    projects.map((project, index) => {
      const apiTasks = taskQueries[index]?.data?.data;
      const preloadedTasks = Array.isArray(project.tasks) ? project.tasks : [];
      const tasks = sortTasksByExecutionOrder(Array.isArray(apiTasks) ? apiTasks : preloadedTasks).filter(
        (task) => task.project_id === project.id
      );
      return [project.id, tasks];
    })
  );

  const allProjectTasks = Array.from(taskMap.values()).flat();
  const totalProjects = projects.length;
  const activeProjects = projects.filter((project) => project.status === "in_progress").length;
  const completedTasks = allProjectTasks.filter((task) => task.status === "completed").length;
  const blockedTasks = allProjectTasks.filter((task) => task.status === "blocked").length;

  if (projectsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground">
            Select a project to open its execution workspace, timeline, and scoped tasks.
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          description={`${activeProjects} active`}
          icon={FolderKanban}
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          description="Across visible project workspaces"
          icon={CheckCircle2}
        />
        <StatCard
          title="In Progress"
          value={activeProjects}
          description="Projects being executed"
          icon={Clock}
        />
        <StatCard
          title="Blocked Tasks"
          value={blockedTasks}
          description={blockedTasks > 0 ? "Dependency attention needed" : "No blockers reported"}
          icon={AlertTriangle}
        />
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description={isAdmin ? "No projects available" : "Create your first project to get started"}
              action={
                !isAdmin ? (
                  <Button asChild>
                    <Link href="/projects/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Project
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectDashboardCard
              key={project.id}
              project={project}
              tasks={taskMap.get(project.id) || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
