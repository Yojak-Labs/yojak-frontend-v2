import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, FolderKanban, CheckSquare, Users, AlertTriangle } from "lucide-react";

const demoViews = {
  dashboard: {
    title: "Dashboard Demo",
    description: "Preview how execution status and critical metrics look in Yojak AI.",
    icon: LayoutDashboard,
  },
  projects: {
    title: "Projects Demo",
    description: "Preview project cards, statuses, and high-level project tracking.",
    icon: FolderKanban,
  },
  tasks: {
    title: "Tasks Demo",
    description: "Preview task queues, priorities, and progress states.",
    icon: CheckSquare,
  },
  profile: {
    title: "Profile Demo",
    description: "Preview user profile details and account overview layout.",
    icon: Users,
  },
} as const;

type DemoViewKey = keyof typeof demoViews;

export default async function DemoViewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  const normalized = view.toLowerCase() as DemoViewKey;
  const config = demoViews[normalized];

  if (!config) {
    notFound();
  }

  const Icon = config.icon;

  const renderDemoLayout = () => {
    if (normalized === "dashboard") {
      return (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle className="text-sm">Active Projects</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">12</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Open Tasks</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">48</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">At Risk</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">3</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">On Schedule</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">89%</p></CardContent></Card>
        </div>
      );
    }

    if (normalized === "projects") {
      return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {["Tower A", "Metro Mall", "Highway Phase 2"].map((project) => (
            <Card key={project}>
              <CardHeader>
                <CardTitle className="text-base">{project}</CardTitle>
                <CardDescription>Sample project card layout</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="outline">in_progress</Badge>
                <span className="text-xs text-muted-foreground">Updated 2h ago</span>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (normalized === "tasks") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Task List Layout</CardTitle>
            <CardDescription>Minimal preview of tasks table/card interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Site Survey", "high", "in_progress"],
              ["Steel Delivery", "urgent", "blocked"],
              ["MEP Install", "medium", "pending"],
            ].map(([title, priority, status]) => (
              <div key={title} className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">Task row demo</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{priority}</Badge>
                  <Badge>{status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Sidebar</CardTitle>
            <CardDescription>Avatar and account meta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">Demo User</p>
            <p className="text-sm text-muted-foreground">demo@yojak.ai</p>
            <Badge variant="outline">professional</Badge>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Form Layout</CardTitle>
            <CardDescription>Minimal account details editing view</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground">First Name</div>
            <div className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground">Last Name</div>
            <div className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground sm:col-span-2">Company</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 border-b border-amber-500/30 bg-amber-50 dark:bg-amber-950/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            You are viewing a demo interface. Sign in or sign up to access real workspace data.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs">
            <Icon className="h-3.5 w-3.5 text-primary" />
            Demo Preview
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
          <p className="text-muted-foreground">{config.description}</p>
        </div>

        {renderDemoLayout()}

        <Card>
          <CardHeader>
            <CardTitle>Demo Data Notice</CardTitle>
            <CardDescription>
              This screen is intentionally showing sample content only. Log in to access your actual Dashboard,
              Projects, Tasks, and Profile data.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/login">Sign In to Continue</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Create Free Account</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
