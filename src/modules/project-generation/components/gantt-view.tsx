"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import type { ScheduleResponse } from "../types";

const LABEL_WIDTH = 220;
const CHART_MIN_WIDTH = 640;
const ROW_HEIGHT = 36;

const normalizeSchedule = (schedule: ScheduleResponse) => {
  const total =
    schedule.total_projected_duration ??
    (schedule as ScheduleResponse & { total_duration?: number }).total_duration ??
    1;

  const tasks = schedule.tasks.map((task) => {
    const legacy = task as typeof task & {
      earliest_start?: number;
      earliest_finish?: number;
      is_critical_path?: boolean;
    };

    return {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      execution_order: task.execution_order,
      start: task.start_offset ?? legacy.earliest_start ?? 0,
      end: task.end_offset ?? legacy.earliest_finish ?? task.start_offset ?? 1,
      dependencies: task.dependencies ?? [],
    };
  });

  const criticalPath = new Set(schedule.critical_path ?? []);

  return {
    total: Math.max(total, 1),
    tasks: [...tasks].sort((a, b) => a.execution_order - b.execution_order),
    criticalPath,
    stages: schedule.execution_stages ?? [],
  };
};

const buildTicks = (total: number, count = 6) => {
  const step = Math.max(1, Math.ceil(total / count));
  const ticks: number[] = [];
  for (let value = 0; value <= total; value += step) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== total) {
    ticks.push(total);
  }
  return ticks;
};

export function GanttView({
  schedule,
  tasks = [],
}: {
  schedule: ScheduleResponse;
  tasks?: Task[];
}) {
  const normalized = useMemo(() => normalizeSchedule(schedule), [schedule]);
  const taskDates = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks]
  );
  const ticks = useMemo(() => buildTicks(normalized.total), [normalized.total]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Project Gantt Chart</CardTitle>
            <CardDescription className="text-xs">
              Schedule derived from task dependencies, estimated hours, and critical path analysis.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[10px]">
              Duration: {normalized.total}h
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Tasks: {normalized.tasks.length}
            </Badge>
            <Badge variant="outline" className="border-red-500/40 text-[10px] text-red-600">
              Critical path: {normalized.criticalPath.size}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="overflow-x-auto border bg-background">
          <div style={{ minWidth: LABEL_WIDTH + CHART_MIN_WIDTH }}>
            <div className="flex border-b bg-muted/20 text-[10px] uppercase tracking-wide text-muted-foreground">
              <div
                className="shrink-0 border-r px-3 py-2 font-medium"
                style={{ width: LABEL_WIDTH }}
              >
                Task
              </div>
              <div className="relative flex-1 py-2">
                <div className="grid" style={{ gridTemplateColumns: `repeat(${ticks.length - 1}, 1fr)` }}>
                  {ticks.slice(0, -1).map((tick, index) => (
                    <div key={tick} className="border-r px-2 text-center last:border-r-0">
                      {tick}h
                      {index === ticks.length - 2 ? ` – ${ticks[ticks.length - 1]}h` : ""}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {normalized.tasks.map((task, index) => {
              const left = (task.start / normalized.total) * 100;
              const width = Math.max(1.5, ((task.end - task.start) / normalized.total) * 100);
              const isCritical = normalized.criticalPath.has(task.id);
              const linkedTask = taskDates.get(task.id);
              const startDate = linkedTask?.start_date;
              const endDate = linkedTask?.end_date || linkedTask?.due_date;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex border-b last:border-b-0",
                    index % 2 === 0 ? "bg-background" : "bg-muted/10"
                  )}
                  style={{ minHeight: ROW_HEIGHT }}
                >
                  <div
                    className="shrink-0 border-r px-3 py-2"
                    style={{ width: LABEL_WIDTH }}
                  >
                    <p className="truncate text-xs font-medium">
                      #{task.execution_order} {task.title}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {startDate && endDate
                        ? `${format(new Date(startDate), "MMM d")} – ${format(new Date(endDate), "MMM d")}`
                        : `${task.start}h – ${task.end}h`}
                    </p>
                  </div>

                  <div className="relative flex-1 py-2 pr-3">
                    <div className="absolute inset-x-0 top-0 flex h-full">
                      {ticks.slice(0, -1).map((tick) => (
                        <div key={tick} className="flex-1 border-r border-dashed border-muted/60 last:border-r-0" />
                      ))}
                    </div>
                    <div className="relative h-full min-h-[20px]">
                      <div
                        className={cn(
                          "absolute top-1/2 h-5 -translate-y-1/2 border text-[10px] font-medium text-white",
                          isCritical
                            ? "border-red-600 bg-red-500"
                            : "border-primary/40 bg-primary/80"
                        )}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${task.title}: ${task.start}h to ${task.end}h`}
                      >
                        <span className="block truncate px-2 leading-5">{task.end - task.start}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 border border-primary/40 bg-primary/80" />
            Scheduled task
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 border border-red-600 bg-red-500" />
            Critical path
          </div>
        </div>

        {normalized.stages.length ? (
          <div className="mt-4 overflow-hidden border-t pt-4">
            <p className="mb-3 text-xs font-medium">Execution stages</p>
            <div className="space-y-2">
              {normalized.stages.map((stage) => {
                const stageTitles = stage.titles?.length
                  ? stage.titles
                  : stage.task_ids.map((id) => {
                      const matched = normalized.tasks.find((task) => task.id === id);
                      return matched ? `#${matched.execution_order} ${matched.title}` : id;
                    });

                return (
                  <div
                    key={stage.stage}
                    className="overflow-hidden border bg-muted/10 p-3"
                  >
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Stage {stage.stage}
                    </p>
                    <ul className="space-y-1">
                      {stageTitles.map((title, titleIndex) => (
                        <li
                          key={`${stage.stage}-${titleIndex}`}
                          className="break-words text-xs leading-relaxed text-foreground"
                        >
                          {title}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
