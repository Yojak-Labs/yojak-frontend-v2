"use client";

import { use } from "react";
import { ProjectGenerationPage } from "@/src/modules/project-generation/pages/project-generation-page";

export default function ProjectGenerationWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProjectGenerationPage projectId={id} />;
}
