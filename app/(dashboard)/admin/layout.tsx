"use client";

import { RouteGuard } from "@/components/layout/route-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteGuard requireAdmin>{children}</RouteGuard>;
}
