"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { projectsApi } from "@/lib/api/projects";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { toast } from "@/components/ui/sonner";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: projectData, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getById(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof projectsApi.update>[1]) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated successfully");
      router.push(`/projects/${id}`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update project");
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
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <CardSkeleton className="flex-1 h-16" />
        </div>
        <CardSkeleton className="h-96" />
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
          <p className="text-muted-foreground">{projectData.data.name}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Update the project information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            project={projectData.data}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
