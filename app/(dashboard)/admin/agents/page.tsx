"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Search,
  Bot,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Zap,
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
import { agentsApi } from "@/lib/api/agents";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import type { Agent } from "@/lib/types";

const agentConfigurationSchema = z.object({
  maxTokens: z.coerce
    .number()
    .int("Max tokens must be an integer")
    .min(1, "Max tokens must be at least 1"),
  temperature: z.coerce
    .number()
    .min(0, "Temperature must be between 0 and 2")
    .max(2, "Temperature must be between 0 and 2"),
});

const agentToolSchema = z.object({
  id: z.string().min(1, "Tool ID is required"),
  source: z.string().min(1, "Source is required"),
  sourceId: z.string().min(1, "Source ID is required"),
  name: z.string().min(1, "Tool name is required"),
});

const agentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(1, "Description is required"),
  model: z.string().min(1, "Model is required"),
  userPrompt: z.string().min(1, "User prompt is required"),
  systemPrompt: z.string().min(1, "System prompt is required"),
  configuration: agentConfigurationSchema,
  tools: z.array(agentToolSchema).min(1, "At least one tool is required"),
});

type AgentFormData = z.infer<typeof agentSchema>;

function AgentCard({
  agent,
  onEdit,
  onDelete,
}: {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              {agent.model && <CardDescription className="text-xs">{agent.model}</CardDescription>}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(agent)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(agent.id)}
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
        <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>

        {agent.tools && agent.tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.tools.slice(0, 3).map((tool, index) => (
              <Badge key={`${tool.id}-${index}`} variant="outline" className="text-xs">
                <Zap className="mr-1 h-3 w-3" />
                {tool.name || tool.id}
              </Badge>
            ))}
            {agent.tools.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{agent.tools.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {agent.tools?.length ?? 0} tools
          </span>
          {agent.createdAt && (
            <span className="text-xs text-muted-foreground">
              Added {format(new Date(agent.createdAt), "MMM d")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AgentForm({
  agent,
  onSubmit,
  onCancel,
  isLoading,
}: {
  agent?: Agent;
  onSubmit: (data: AgentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || "",
      description: agent?.description || "",
      model: agent?.model || "",
      userPrompt: agent?.userPrompt || "",
      systemPrompt: agent?.systemPrompt || "",
      configuration: {
        maxTokens:
          typeof agent?.configuration?.maxTokens === "number" ? agent.configuration.maxTokens : 1024,
        temperature:
          typeof agent?.configuration?.temperature === "number"
            ? agent.configuration.temperature
            : 0.7,
      },
      tools:
        agent?.tools && agent.tools.length > 0
          ? agent.tools
          : [{ id: "", source: "", sourceId: "", name: "" }],
    },
  });

  const {
    fields: toolFields,
    append: appendTool,
    remove: removeTool,
  } = useFieldArray({
    control,
    name: "tools",
    // Avoid clobbering our `tools.*.id` field with RHF's internal field id.
    keyName: "fieldKey",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="Enter agent name"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the agent's purpose..."
          rows={3}
          {...register("description")}
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model *</Label>
        <Input
          id="model"
          placeholder="e.g., gpt-4.1-mini"
          {...register("model")}
          className={errors.model ? "border-destructive" : ""}
        />
        {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="userPrompt">User Prompt *</Label>
        <Textarea
          id="userPrompt"
          placeholder="What the user wants the agent to do..."
          rows={4}
          {...register("userPrompt")}
          className={errors.userPrompt ? "border-destructive" : ""}
        />
        {errors.userPrompt && (
          <p className="text-sm text-destructive">{errors.userPrompt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt *</Label>
        <Textarea
          id="systemPrompt"
          placeholder="System instructions / behavior constraints..."
          rows={4}
          {...register("systemPrompt")}
          className={errors.systemPrompt ? "border-destructive" : ""}
        />
        {errors.systemPrompt && (
          <p className="text-sm text-destructive">{errors.systemPrompt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Configuration *</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="configuration.maxTokens">Max Tokens *</Label>
            <Input
              id="configuration.maxTokens"
              type="number"
              inputMode="numeric"
              placeholder="1024"
              {...register("configuration.maxTokens")}
              className={errors.configuration?.maxTokens ? "border-destructive" : ""}
            />
            {errors.configuration?.maxTokens && (
              <p className="text-sm text-destructive">{errors.configuration.maxTokens.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="configuration.temperature">Temperature *</Label>
            <Input
              id="configuration.temperature"
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder="0.7"
              {...register("configuration.temperature")}
              className={errors.configuration?.temperature ? "border-destructive" : ""}
            />
            {errors.configuration?.temperature && (
              <p className="text-sm text-destructive">
                {errors.configuration.temperature.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tools *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendTool({ id: "", source: "", sourceId: "", name: "" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Tool
          </Button>
        </div>

        {errors.tools && !Array.isArray(errors.tools) && (
          <p className="text-sm text-destructive">{errors.tools.message}</p>
        )}

        <div className="space-y-4">
          {toolFields.map((field, index) => (
            <Card key={field.fieldKey} className="border-white/10">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tool #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeTool(index)}
                    disabled={toolFields.length <= 1}
                    aria-label="Remove tool"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`tools.${index}.id`}>ID *</Label>
                    <Input
                      id={`tools.${index}.id`}
                      placeholder="tool-id"
                      defaultValue={field.id}
                      {...register(`tools.${index}.id` as const)}
                      className={errors.tools?.[index]?.id ? "border-destructive" : ""}
                    />
                    {errors.tools?.[index]?.id && (
                      <p className="text-sm text-destructive">
                        {errors.tools[index]?.id?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`tools.${index}.name`}>Name *</Label>
                    <Input
                      id={`tools.${index}.name`}
                      placeholder="Tool name"
                      defaultValue={field.name}
                      {...register(`tools.${index}.name` as const)}
                      className={errors.tools?.[index]?.name ? "border-destructive" : ""}
                    />
                    {errors.tools?.[index]?.name && (
                      <p className="text-sm text-destructive">
                        {errors.tools[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`tools.${index}.source`}>Source *</Label>
                    <Input
                      id={`tools.${index}.source`}
                      placeholder="e.g., internal"
                      defaultValue={field.source}
                      {...register(`tools.${index}.source` as const)}
                      className={errors.tools?.[index]?.source ? "border-destructive" : ""}
                    />
                    {errors.tools?.[index]?.source && (
                      <p className="text-sm text-destructive">
                        {errors.tools[index]?.source?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`tools.${index}.sourceId`}>Source ID *</Label>
                    <Input
                      id={`tools.${index}.sourceId`}
                      placeholder="e.g., github:repo"
                      defaultValue={field.sourceId}
                      {...register(`tools.${index}.sourceId` as const)}
                      className={errors.tools?.[index]?.sourceId ? "border-destructive" : ""}
                    />
                    {errors.tools?.[index]?.sourceId && (
                      <p className="text-sm text-destructive">
                        {errors.tools[index]?.sourceId?.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {agent ? "Update Agent" : "Create Agent"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminAgentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: agentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent created successfully");
      setShowCreateDialog(false);
    },
    onError: () => {
      toast.error("Failed to create agent");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof agentsApi.update>[1] }) =>
      agentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent updated successfully");
      setEditAgent(null);
    },
    onError: () => {
      toast.error("Failed to update agent. The API may not fully support this operation.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent deleted successfully");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete agent");
    },
  });

  const agents = data?.data || [];
  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFormSubmit = (formData: AgentFormData, isEdit: boolean) => {
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      model: formData.model.trim(),
      userPrompt: formData.userPrompt.trim(),
      systemPrompt: formData.systemPrompt.trim(),
      configuration: {
        maxTokens: formData.configuration.maxTokens,
        temperature: formData.configuration.temperature,
      },
      tools: formData.tools.map((tool) => ({
        id: tool.id.trim(),
        source: tool.source.trim(),
        sourceId: tool.sourceId.trim(),
        name: tool.name.trim(),
      })),
    };

    if (isEdit && editAgent) {
      updateMutation.mutate({ id: editAgent.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load agents</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["agents"] })}
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
          <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">
            Manage AI agents for project automation
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={Bot}
              title={search ? "No matching agents" : "No agents yet"}
              description={
                search
                  ? "Try adjusting your search"
                  : "Add your first AI agent to automate tasks"
              }
              action={
                !search && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Agent
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={setEditAgent}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add AI Agent</DialogTitle>
            <DialogDescription>
              Create a new AI agent for task automation
            </DialogDescription>
          </DialogHeader>
          <AgentForm
            onSubmit={(data) => handleFormSubmit(data, false)}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editAgent} onOpenChange={(open) => !open && setEditAgent(null)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit AI Agent</DialogTitle>
            <DialogDescription>Update agent configuration</DialogDescription>
          </DialogHeader>
          {editAgent && (
            <AgentForm
              agent={editAgent}
              onSubmit={(data) => handleFormSubmit(data, true)}
              onCancel={() => setEditAgent(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Agent"
        description="Are you sure you want to delete this agent? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
