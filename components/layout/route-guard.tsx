"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function RouteGuard({ children, requireAdmin = false }: RouteGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated && requireAdmin && user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, requireAdmin, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show demo banner for unauthenticated users instead of redirecting
  if (!isAuthenticated) {
    return (
      <>
        <div className="sticky top-0 z-50 border-b border-amber-500/30 bg-amber-50 dark:bg-amber-950/30">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              You are viewing the demo. Sign in for full access to all features.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" asChild className="border-amber-500/50 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/50">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              <Button size="sm" asChild className="bg-amber-600 text-white hover:bg-amber-700">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  if (requireAdmin && user?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
