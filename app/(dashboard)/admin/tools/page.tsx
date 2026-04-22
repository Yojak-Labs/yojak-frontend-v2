"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Search,
  Wrench,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { toolsApi } from "@/lib/api/tools";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import type { Tool } from "@/lib/types";

const toolSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(1, "Description is required"),
  parameters: z.string().min(1, "Parameters JSON is required"),
});

type ToolFormData = z.infer<typeof toolSchema>;

const getToolListKey = (tool: Tool, index: number) => {
  if (tool.id?.trim()) return `tool-${tool.id}`;
  if (tool.name?.trim()) return `tool-${tool.name}-${index}`;
  return `tool-fallback-${index}`;
};

function ToolCard({
  tool,
  onEdit,
  onDelete,
}: {
  tool: Tool;
  onEdit: (tool: Tool) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{tool.name}</CardTitle>
              <CardDescription className="text-xs">ID: {tool.id}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(tool)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(tool.id)}
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
        <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>

        <Badge variant="outline" className="text-xs">
          <Settings className="mr-1 h-3 w-3" />
          {Object.keys(tool.parameters || {}).length} parameter entries
        </Badge>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">Tool Definition Ready</span>
          {tool.createdAt && (
            <span className="text-xs text-muted-foreground">
              Added {format(new Date(tool.createdAt), "MMM d")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ToolForm({
  tool,
  onSubmit,
  onCancel,
  isLoading,
}: {
  tool?: Tool;
  onSubmit: (data: ToolFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ToolFormData>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      id: tool?.id || "",
      name: tool?.name || "",
      description: tool?.description || "",
      parameters: tool?.parameters ? JSON.stringify(tool.parameters, null, 2) : "{}",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="id">ID *</Label>
        <Input
          id="id"
          placeholder="tool-id"
          readOnly={!!tool}
          {...register("id")}
          className={errors.id ? "border-destructive" : tool ? "bg-muted" : ""}
        />
        {errors.id && <p className="text-sm text-destructive">{errors.id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="Enter tool name"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the tool's purpose..."
          rows={3}
          {...register("description")}
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="parameters">Tool Definition Parameters (JSON map) *</Label>
        <Textarea
          id="parameters"
          placeholder='{"timeout": 30, "provider": "openai"}'
          rows={6}
          className="font-mono text-sm"
          {...register("parameters")}
        />
        {errors.parameters && (
          <p className="text-sm text-destructive">{errors.parameters.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter parameters as valid JSON object/map.
        </p>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tool ? "Update Tool" : "Create Tool"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminToolsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["tools"],
    queryFn: () => toolsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: toolsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Tool created successfully");
      setShowCreateDialog(false);
    },
    onError: () => {
      toast.error("Failed to create tool");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof toolsApi.update>[1] }) =>
      toolsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Tool updated successfully");
      setEditTool(null);
    },
    onError: () => {
      toast.error("Failed to update tool");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => toolsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Tool deleted successfully");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete tool");
    },
  });

  const tools = data?.data || [];
  const searchTerm = search.toLowerCase();
  const filteredTools = tools.filter((tool) =>
    (tool.name || "").toLowerCase().includes(searchTerm)
  );

  const handleFormSubmit = (formData: ToolFormData, isEdit: boolean) => {
    let parameters: Record<string, unknown>;

    try {
      const parsed = JSON.parse(formData.parameters);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        toast.error("Parameters must be a JSON object (map)");
        return;
      }
      parameters = parsed as Record<string, unknown>;
    } catch {
      toast.error("Invalid JSON in parameters field");
      return;
    }

    const payload = {
      id: isEdit && editTool ? editTool.id : formData.id.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      parameters,
    };

    if (isEdit && editTool) {
      updateMutation.mutate({ id: editTool.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load tools</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["tools"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground">
            Manage tools and integrations for the platform
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tool
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filteredTools.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={Wrench}
              title={search ? "No matching tools" : "No tools yet"}
              description={
                search
                  ? "Try adjusting your search"
                  : "Add your first tool to extend platform capabilities"
              }
              action={
                !search && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tool
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool, index) => (
            <ToolCard
              key={getToolListKey(tool, index)}
              tool={tool}
              onEdit={setEditTool}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tool</DialogTitle>
            <DialogDescription>
              Create a new tool using id, name, description and parameters map.
            </DialogDescription>
          </DialogHeader>
          <ToolForm
            onSubmit={(data) => handleFormSubmit(data, false)}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTool} onOpenChange={(open) => !open && setEditTool(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
            <DialogDescription>Update tool definition and parameters map.</DialogDescription>
          </DialogHeader>
          {editTool && (
            <ToolForm
              tool={editTool}
              onSubmit={(data) => handleFormSubmit(data, true)}
              onCancel={() => setEditTool(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Tool"
        description="Are you sure you want to delete this tool? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
