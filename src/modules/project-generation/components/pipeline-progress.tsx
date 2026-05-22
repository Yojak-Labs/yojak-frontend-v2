"use client";

import { CheckCircle2, CircleDashed, LoaderCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PipelineStage } from "../types";

const stageIcon = {
  pending: CircleDashed,
  running: LoaderCircle,
  completed: CheckCircle2,
  failed: XCircle,
} as const;

const stageTone = {
  pending: "text-muted-foreground",
  running: "text-blue-600",
  completed: "text-emerald-600",
  failed: "text-red-600",
} as const;

export function PipelineProgress({
  stages,
  completion,
}: {
  stages: PipelineStage[];
  completion: number;
}) {
  return (
    <Card className="border-primary/20 enter-fade-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Generation Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <p className="text-muted-foreground">Overall completion</p>
            <p className="font-medium">{completion}%</p>
          </div>
          <Progress value={completion} />
        </div>

        <div className="grid gap-2 lg:grid-cols-2">
          {stages.map((stage, index) => {
            const Icon = stageIcon[stage.state];
            return (
              <div
                key={stage.key}
                className={cn(
                  "flex items-start gap-2 p-3",
                  "bg-muted/30 transition-all duration-300",
                  "enter-fade-up",
                  stage.state === "running" && "bg-blue-500/10 stage-active-glow pipeline-track",
                  stage.state === "completed" && "bg-emerald-500/10",
                  stage.state === "failed" && "bg-red-500/10"
                )}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    stageTone[stage.state],
                    stage.state === "running" && "animate-spin"
                  )}
                />
                <div>
                  <p className="text-xs font-medium">{stage.title}</p>
                  <p className="text-xs text-muted-foreground">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
