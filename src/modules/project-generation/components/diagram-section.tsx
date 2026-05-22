"use client";

import { Download, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DiagramResult } from "../types";

export function DiagramSection({ diagram }: { diagram: DiagramResult }) {
  const urls = diagram.download_urls || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Diagram Output</CardTitle>
        <CardDescription className="text-xs">
          A7 semantic-to-deterministic rendered site layout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-[500px] overflow-auto bg-muted/30 p-3">
          {diagram.svg ? (
            <div
              className="min-w-[700px]"
              dangerouslySetInnerHTML={{ __html: diagram.svg }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Diagram is still rendering...</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {urls.svg ? (
            <Button asChild size="sm" variant="outline">
              <a href={urls.svg} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Open SVG
              </a>
            </Button>
          ) : null}
          {urls.png ? (
            <Button asChild size="sm" variant="outline">
              <a href={urls.png} target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5" />
                PNG
              </a>
            </Button>
          ) : null}
          {urls.pdf ? (
            <Button asChild size="sm" variant="outline">
              <a href={urls.pdf} target="_blank" rel="noreferrer">
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
