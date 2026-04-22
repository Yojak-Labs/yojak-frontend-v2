"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/projects/project-form";
import { projectsApi } from "@/lib/api/projects";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "@/components/ui/sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  if (isAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-destructive mb-4">Admins cannot create projects</p>
        <Button asChild>
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
      router.push("/projects");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (data: any) => {
    const payload = {
      ...data,
      budget: data.budget ? Number(data.budget) : undefined,
      area_sq_ft: data.area_sq_ft ? Number(data.area_sq_ft) : undefined,
      floors: data.floors ? Number(data.floors) : undefined,
      start_date: data.start_date ? data.start_date.toISOString() : undefined,
      end_date: data.end_date ? data.end_date.toISOString() : undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
          <p className="text-muted-foreground">
            Create a new construction project
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Fill in the information below to create your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
