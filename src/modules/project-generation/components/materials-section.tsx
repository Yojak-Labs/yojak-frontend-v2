"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MaterialCostReportData } from "../types";

const flattenMaterials = (report: MaterialCostReportData) =>
  report.tasks.flatMap((task) =>
    [...task.tiers.basic, ...task.tiers.good, ...task.tiers.premium].map((item) => ({
      task: task.task_title,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      total: item.total_cost,
      brand: item.brand,
    }))
  );

export function MaterialsSection({ report }: { report: MaterialCostReportData }) {
  const rows = flattenMaterials(report).slice(0, 30);
  const total = rows.reduce((sum, row) => sum + (row.total || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Materials & Cost</CardTitle>
        <CardDescription className="text-xs">
          A4 output with quantities, pricing, and task-level grouping.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted/30 p-3 text-xs">
          <p className="text-muted-foreground">Visible subtotal</p>
          <p className="text-lg font-semibold">${total.toLocaleString()}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Task</TableHead>
              <TableHead className="text-xs">Material</TableHead>
              <TableHead className="text-xs">Qty</TableHead>
              <TableHead className="text-xs">Brand</TableHead>
              <TableHead className="text-right text-xs">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.task}-${row.name}-${index}`}>
                <TableCell className="max-w-[190px] truncate text-xs">{row.task}</TableCell>
                <TableCell className="text-xs">{row.name}</TableCell>
                <TableCell className="text-xs">
                  {row.quantity} {row.unit}
                </TableCell>
                <TableCell className="text-xs">{row.brand || "-"}</TableCell>
                <TableCell className="text-right text-xs">${row.total.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
