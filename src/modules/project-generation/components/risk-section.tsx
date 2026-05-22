"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { RiskReport } from "../types";

const levelTone: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  critical: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export function RiskSection({ report }: { report: RiskReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Risk Analysis</CardTitle>
        <CardDescription className="text-xs">
          A6 deterministic output with mitigation recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Overall project risk</p>
            <p className="text-xl font-semibold">{Math.round(report.overall_project_risk)}%</p>
            <Progress value={report.overall_project_risk} className="mt-2 h-1.5" />
          </div>
          <div className="bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Delay probability</p>
            <p className="text-xl font-semibold">{Math.round(report.delay_probability)}%</p>
            <Progress value={report.delay_probability} className="mt-2 h-1.5" />
          </div>
        </div>

        <div className="space-y-2">
          {report.tasks.slice(0, 8).map((task) => (
            <div key={task.task_id} className="bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium">{task.task_title}</p>
                <Badge className={levelTone[task.risk_level] || levelTone.medium}>
                  {task.risk_level}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Risk {Math.round(task.risk_score)}%</span>
                <span>Delay {Math.round(task.delay_probability)}%</span>
              </div>
              {task.mitigation_strategies?.length ? (
                <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  {task.mitigation_strategies[0]}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
