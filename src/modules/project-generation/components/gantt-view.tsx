"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ScheduleResponse } from "../types";

const trackColors = [
  "bg-blue-500/80",
  "bg-violet-500/80",
  "bg-cyan-500/80",
  "bg-emerald-500/80",
  "bg-amber-500/80",
];

export function GanttView({ schedule }: { schedule: ScheduleResponse }) {
  const total = Math.max(schedule.total_duration || 1, 1);
  const sorted = [...schedule.tasks].sort((a, b) => a.execution_order - b.execution_order);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Gantt Timeline</CardTitle>
        <CardDescription className="text-xs">
          Deterministic schedule from task dependencies and execution stages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((task, index) => {
          const left = Math.max(0, (task.earliest_start / total) * 100);
          const width = Math.max(4, ((task.earliest_finish - task.earliest_start) / total) * 100);
          return (
            <div key={task.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <p className="truncate font-medium">
                  #{task.execution_order} {task.title}
                </p>
                <p className="text-muted-foreground">
                  {task.earliest_start}d - {task.earliest_finish}d
                </p>
              </div>
              <div className="relative h-6 bg-muted/40">
                <div
                  className={cn(
                    "absolute top-1 h-4",
                    trackColors[index % trackColors.length],
                    task.is_critical_path && "ring-1 ring-red-500/60"
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
