"use client";

import { Download, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DiagramResult } from "../types";

const apiOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/v1/yojakai")
  .trim()
  .replace(/\/v1\/yojakai\/?$/, "");

function diagramAssetUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${apiOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function DiagramSection({ diagram }: { diagram: DiagramResult }) {
  const urls = diagram.download_urls || {};
  const blueprintUrl = diagramAssetUrl(diagram.image_url || urls.png);
  const svgUrl = diagramAssetUrl(urls.svg);
  const pdfUrl = diagramAssetUrl(urls.pdf);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Diagram Output</CardTitle>
        <CardDescription className="text-xs">
          Semantic layout plus AutoCAD-style blueprint when image generation succeeds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {blueprintUrl ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">AI blueprint</p>
            <img
              src={blueprintUrl}
              alt="Generated architectural blueprint"
              className="max-h-[500px] w-full border border-border object-contain bg-white"
            />
          </div>
        ) : null}
        <div className="max-h-[500px] overflow-auto bg-muted/30 p-3">
          {diagram.svg ? (
            <div
              className="min-w-[700px]"
              dangerouslySetInnerHTML={{ __html: diagram.svg }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Diagram layout is still rendering...</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {svgUrl ? (
            <Button asChild size="sm" variant="outline">
              <a href={svgUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Open SVG
              </a>
            </Button>
          ) : null}
          {blueprintUrl ? (
            <Button asChild size="sm" variant="outline">
              <a href={blueprintUrl} target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5" />
                Blueprint PNG
              </a>
            </Button>
          ) : null}
          {pdfUrl ? (
            <Button asChild size="sm" variant="outline">
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5" />
                PDF
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
