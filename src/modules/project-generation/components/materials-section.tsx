"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MaterialCostReportData, MaterialOption, MaterialTier } from "../types";

type TierKey = keyof MaterialTier;

const tierMeta: Record<TierKey, { label: string; description: string; accent: string }> = {
  basic: {
    label: "Basic",
    description: "Budget-conscious material options",
    accent: "border-muted-foreground/30 bg-muted/20",
  },
  good: {
    label: "Good",
    description: "Balanced quality and cost",
    accent: "border-blue-500/30 bg-blue-500/10",
  },
  premium: {
    label: "Premium",
    description: "High-end material selections",
    accent: "border-amber-500/30 bg-amber-500/10",
  },
};

const tierKeys: TierKey[] = ["basic", "good", "premium"];

const sumTierCost = (report: MaterialCostReportData, tier: TierKey) =>
  report.tasks.reduce(
    (total, task) =>
      total + (task.tiers[tier]?.reduce((sum, item) => sum + (item.total_cost || 0), 0) ?? 0),
    0
  );

const tierRows = (report: MaterialCostReportData, tier: TierKey) =>
  report.tasks.flatMap((task) =>
    (task.tiers[tier] ?? []).map((item: MaterialOption) => ({
      task: task.task_title,
      tier,
      ...item,
    }))
  );

export function MaterialsSection({ report }: { report: MaterialCostReportData }) {
  const [activeTier, setActiveTier] = useState<TierKey>("basic");

  const tierTotals = useMemo(
    () =>
      tierKeys.reduce(
        (acc, tier) => {
          acc[tier] = sumTierCost(report, tier);
          return acc;
        },
        {} as Record<TierKey, number>
      ),
    [report]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Materials & Cost</CardTitle>
        <CardDescription className="text-xs">
          Tiered estimates aligned with backend material report: basic, good, and premium layers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {tierKeys.map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setActiveTier(tier)}
              className={cn(
                "border p-3 text-left transition-colors",
                tierMeta[tier].accent,
                activeTier === tier && "ring-1 ring-primary"
              )}
            >
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {tierMeta[tier].label}
              </p>
              <p className="mt-1 text-lg font-semibold">${tierTotals[tier].toLocaleString()}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{tierMeta[tier].description}</p>
            </button>
          ))}
        </div>

        <Tabs value={activeTier} onValueChange={(value) => setActiveTier(value as TierKey)}>
          <TabsList className="h-8">
            {tierKeys.map((tier) => (
              <TabsTrigger key={tier} value={tier} className="text-xs">
                {tierMeta[tier].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tierKeys.map((tier) => {
            const rows = tierRows(report, tier);
            return (
            <TabsContent key={tier} value={tier} className="mt-3 space-y-3">
              <div className="border bg-muted/20 p-3 text-xs">
                <p className="text-muted-foreground">{tierMeta[tier].label} tier subtotal</p>
                <p className="text-lg font-semibold">${tierTotals[tier].toLocaleString()}</p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Task</TableHead>
                    <TableHead className="text-xs">Material</TableHead>
                    <TableHead className="text-xs">Qty</TableHead>
                    <TableHead className="text-xs">Unit cost</TableHead>
                    <TableHead className="text-xs">Brand</TableHead>
                    <TableHead className="text-right text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length ? (
                    rows.map((row, index) => (
                      <TableRow key={`${row.task}-${row.name}-${index}`}>
                        <TableCell className="max-w-[180px] truncate text-xs">{row.task}</TableCell>
                        <TableCell className="text-xs">
                          <div>
                            <p>{row.name}</p>
                            {row.description ? (
                              <p className="text-[10px] text-muted-foreground">{row.description}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.quantity} {row.unit}
                        </TableCell>
                        <TableCell className="text-xs">${row.unit_cost.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{row.brand || "—"}</TableCell>
                        <TableCell className="text-right text-xs">
                          ${row.total_cost.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-xs text-muted-foreground">
                        No {tierMeta[tier].label.toLowerCase()} tier materials for this report.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
