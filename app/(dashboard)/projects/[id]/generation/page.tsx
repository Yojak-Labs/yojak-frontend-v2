"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectGenerationPage } from "@/src/modules/project-generation/pages/project-generation-page";

export default function ProjectGenerationWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const autoStart = searchParams.get("start") === "1";

  return <ProjectGenerationPage projectId={id} autoStart={autoStart} />;
}
