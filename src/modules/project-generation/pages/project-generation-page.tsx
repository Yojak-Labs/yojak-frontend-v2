"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectExecutionTimeline } from "@/components/projects/project-workflow";
import { PipelineProgress } from "../components/pipeline-progress";
import { GanttView } from "../components/gantt-view";
import { RiskSection } from "../components/risk-section";
import { MaterialsSection } from "../components/materials-section";
import { DiagramSection } from "../components/diagram-section";
import { useProjectGeneration } from "../hooks/use-project-generation";

const RevealSection = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <div className="enter-fade-up" style={{ animationDelay: `${delay}ms` }}>
    {children}
  </div>
);

export function ProjectGenerationPage({ projectId }: { projectId: string }) {
  const {
    projectQuery,
    tasksQuery,
    tasks,
    orchestrationData,
    stages,
    completion,
    runTriggered,
    runError,
    riskReport,
    materialReport,
  } = useProjectGeneration(projectId);

  const project = projectQuery.data?.data;
  return (
    <div className="space-y-5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 enter-fade">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="h-7 px-2">
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
          <h1 className="text-base font-semibold">
            {project?.name || "Project"} generation workspace
          </h1>
          <p className="text-xs text-muted-foreground">
            Live orchestration for planner, scheduling, risk, materials, and diagram outputs.
          </p>
        </div>
        <div className="rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary">
          Auto-generation enabled
        </div>
      </div>

      <PipelineProgress stages={stages} completion={completion} />

      {runError ? (
        <Card className="enter-fade-up">
          <CardContent className="py-4">
            <p className="text-xs text-destructive">{runError}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {tasks.length ? (
            <RevealSection delay={40}>
              <ProjectExecutionTimeline tasks={tasks} />
            </RevealSection>
          ) : (
            <RevealSection delay={40}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tasks</CardTitle>
                  <CardDescription className="text-xs">
                    Planner tasks unlock once orchestration starts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-0">
                  <EmptyState
                  icon={ClipboardList}
                    title="No generated tasks yet"
                  description="Agent workflow is running and tasks will appear automatically."
                  />
                </CardContent>
              </Card>
            </RevealSection>
          )}

          {orchestrationData?.schedule ? (
            <RevealSection delay={90}>
              <GanttView schedule={orchestrationData.schedule} />
            </RevealSection>
          ) : null}
          {riskReport ? (
            <RevealSection delay={130}>
              <RiskSection report={riskReport} />
            </RevealSection>
          ) : null}
          {materialReport ? (
            <RevealSection delay={170}>
              <MaterialsSection report={materialReport} />
            </RevealSection>
          ) : null}
        </div>

        <div className="space-y-4">
          {orchestrationData?.diagram ? (
            <RevealSection delay={120}>
              <DiagramSection diagram={orchestrationData.diagram} />
            </RevealSection>
          ) : null}
          <RevealSection delay={180}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Generation status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Project query: {projectQuery.isFetching ? "refreshing" : "idle"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tasks query: {tasksQuery.isFetching ? "refreshing" : "idle"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Orchestration: {orchestrationData?.orchestration_ok ? "completed" : runTriggered ? "running" : "not started"}
                </p>
              </CardContent>
            </Card>
          </RevealSection>
        </div>
      </div>
    </div>
  );
}
