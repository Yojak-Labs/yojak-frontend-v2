"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus, ProjectType } from "@/lib/types";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  type: z.enum(["residential", "commercial", "industrial", "infrastructure"]),
  location: z.string().optional(),
  budget: z.coerce.number().positive().optional().or(z.literal("")),
  area_sq_ft: z.coerce.number().positive().optional().or(z.literal("")),
  floors: z.coerce.number().positive().int().optional().or(z.literal("")),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  requirements: z.string().optional(),
  status: z.enum(["planned", "in_progress", "completed", "on_hold", "cancelled"]),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormData) => void;
  isLoading?: boolean;
}

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "infrastructure", label: "Infrastructure" },
];

const projectStatuses: { value: ProjectStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
];

export function ProjectForm({ project, onSubmit, isLoading }: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      type: project?.type || "residential",
      location: project?.location || "",
      budget: project?.budget || "",
      area_sq_ft: project?.area_sq_ft || "",
      floors: project?.floors || "",
      start_date: project?.start_date ? new Date(project.start_date) : undefined,
      end_date: project?.end_date ? new Date(project.end_date) : undefined,
      requirements: project?.requirements || "",
      status: project?.status || "planned",
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const projectType = watch("type");
  const status = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="glass-panel space-y-4 rounded-2xl p-5">
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="Enter project name"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Project Type *</Label>
            <Select
              value={projectType}
              onValueChange={(value) => setValue("type", value as ProjectType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={status}
              onValueChange={(value) => setValue("status", value as ProjectStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {projectStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the project..."
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Project location"
              {...register("location")}
            />
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="glass-panel space-y-4 rounded-2xl p-5">
        <h3 className="text-lg font-medium">Project Details</h3>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="budget">Budget ($)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="0.00"
              {...register("budget")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area_sq_ft">Area (sq ft)</Label>
            <Input
              id="area_sq_ft"
              type="number"
              placeholder="0"
              {...register("area_sq_ft")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="floors">Number of Floors</Label>
            <Input
              id="floors"
              type="number"
              placeholder="0"
              {...register("floors")}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-panel space-y-4 rounded-2xl p-5">
        <h3 className="text-lg font-medium">Timeline</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => setValue("start_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => setValue("end_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="glass-panel space-y-4 rounded-2xl p-5">
        <h3 className="text-lg font-medium">Requirements</h3>
        
        <div className="space-y-2">
          <Label htmlFor="requirements">Special Requirements</Label>
          <Textarea
            id="requirements"
            placeholder="List any special requirements, permits, or considerations..."
            rows={4}
            {...register("requirements")}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="glass-panel flex justify-end gap-4 rounded-2xl border-t p-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {project ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
