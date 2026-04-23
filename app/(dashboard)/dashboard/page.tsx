"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { projectsApi } from "@/lib/api/projects";
import { tasksApi } from "@/lib/api/tasks";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import type { Project, Task } from "@/lib/types";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p
            className={`text-xs mt-1 ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RecentProjectsCard({
  projects,
  isAdmin,
}: {
  projects: Project[];
  isAdmin: boolean;
}) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your latest construction projects</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description={isAdmin ? "No projects available" : "Create your first project to get started"}
            action={!isAdmin ? (
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Link>
              </Button>
            ) : undefined}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your latest construction projects</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.slice(0, 5).map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {project.location || project.type}
                </p>
              </div>
              <StatusBadge status={project.status} />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentTasksCard({
  tasks,
  isAdmin,
}: {
  tasks: Task[];
  isAdmin: boolean;
}) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Tasks that need your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description={isAdmin ? "No tasks available" : "Tasks will appear here when created"}
            action={!isAdmin ? (
              <Button asChild>
                <Link href="/tasks">
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Link>
              </Button>
            ) : undefined}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Tasks that need your attention</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tasks">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.slice(0, 5).map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.due_date
                    ? `Due ${format(new Date(task.due_date), "MMM d, yyyy")}`
                    : "No due date"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", isAdmin ? "admin" : "user"],
    queryFn: () => (isAdmin ? projectsApi.getAllAdmin() : projectsApi.getAll()),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.getAll(),
  });

  const isLoading = projectsLoading || tasksLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const projects = Array.isArray(projectsData?.data) ? projectsData.data : [];
  const visibleProjects = projects;
  const tasks = Array.isArray(tasksData?.data) ? tasksData.data : [];
  const visibleProjectIds = new Set(visibleProjects.map((project) => project.id));
  const visibleTasks = isAdmin
    ? tasks
    : tasks.filter((task) => visibleProjectIds.has(task.project_id));

  // Compute statistics
  const totalProjects = visibleProjects.length;
  const activeProjects = visibleProjects.filter((p) => p.status === "in_progress").length;
  const totalTasks = visibleTasks.length;
  const activeTasks = visibleTasks.filter(
    (t) => t.status === "in_progress" || t.status === "pending"
  ).length;
  const overdueTasks = visibleTasks.filter((t) => {
    if (!t.due_date || t.status === "completed") return false;
    return new Date(t.due_date) < new Date();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your construction projects
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          description={`${activeProjects} active`}
          icon={FolderKanban}
        />
        <StatCard
          title="Active Tasks"
          value={activeTasks}
          description={`${totalTasks} total`}
          icon={CheckSquare}
        />
        <StatCard
          title="In Progress"
          value={activeProjects}
          description="Projects being worked on"
          icon={Clock}
        />
        <StatCard
          title="Overdue Tasks"
          value={overdueTasks}
          description={overdueTasks > 0 ? "Needs attention" : "All on track"}
          icon={AlertTriangle}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentProjectsCard projects={visibleProjects} isAdmin={isAdmin} />
        <RecentTasksCard tasks={visibleTasks} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
