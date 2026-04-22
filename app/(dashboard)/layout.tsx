"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, Plus, Search, Sparkles } from "lucide-react";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { RouteGuard } from "@/components/layout/route-guard";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <QueryProvider>
      <AuthProvider>
        <RouteGuard>
          <div className="min-h-screen bg-background">
            <AppSidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((prev) => !prev)} />
            <MobileNav />
            <main className={collapsed ? "md:pl-20" : "md:pl-72"}>
              <div className="sticky top-0 z-30 hidden border-b border-border/70 bg-background/80 backdrop-blur-xl md:block">
                <div className="flex h-16 items-center justify-between gap-4 px-6">
                  <div className="relative w-full max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search projects, tasks, or agent outputs..." className="pl-9" />
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/projects/new">
                        <Plus className="h-4 w-4" />
                        New Project
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon-sm" aria-label="Notifications">
                      <Bell className="h-4 w-4" />
                    </Button>
                    <div className="glass-panel flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI Pipeline Online</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
          </div>
        </RouteGuard>
      </AuthProvider>
    </QueryProvider>
  );
}
