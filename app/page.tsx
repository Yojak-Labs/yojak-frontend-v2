"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Shield,
  Sparkles,
  Upload,
  Users,
  Workflow,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoLink } from "@/components/layout/logo-link";
import { LogoMark } from "@/components/layout/logo-mark";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";

const agents = [
  { id: "a1", name: "Regulation Agent", message: "Analyzing regulations..." },
  { id: "a2", name: "Planner Agent", message: "Generating execution plan..." },
  { id: "a3", name: "Resource/Design Agent", message: "Synthesizing resource design..." },
  { id: "a4", name: "Material/Cost Agent", message: "Calculating cost intelligence..." },
  { id: "a5", name: "Scheduler Agent", message: "Optimizing timeline..." },
  { id: "a6", name: "Risk/Delay Agent", message: "Predicting delays..." },
  { id: "a7", name: "Diagram Generator", message: "Rendering final diagrams..." },
];

const featureCards = [
  {
    title: "AI Task Planner",
    desc: "Upload a blueprint or describe your project. AI generates a full task breakdown with dependencies and timelines instantly.",
    icon: ClipboardList,
  },
  {
    title: "Smart Worker Assignment",
    desc: "Automatically match workers to tasks based on skills, availability, and location.",
    icon: Users,
  },
  {
    title: "Multi-Agent System",
    desc: "Planner, assignment, optimization, and risk agents collaborate on the best schedule.",
    icon: Bot,
  },
  {
    title: "Live Dashboard",
    desc: "Track task progress, resource utilization, and risk flags in one real-time view.",
    icon: LayoutDashboard,
  },
  {
    title: "Delay Prediction",
    desc: "Surface risks before they become delays using timeline and execution signals.",
    icon: Sparkles,
  },
  {
    title: "Blueprint Intelligence",
    desc: "Parse technical drawings and convert them into structured project data.",
    icon: FolderKanban,
  },
];

const steps = [
  {
    icon: Upload,
    title: "Upload or describe your project",
    desc: "Paste in a blueprint PDF or write a plain-English description of your construction project.",
  },
  {
    icon: Sparkles,
    title: "AI generates a task plan",
    desc: "The Planner Agent decomposes your project into sequenced tasks with durations and dependencies.",
  },
  {
    icon: Workflow,
    title: "Agents optimize and assign",
    desc: "Specialized agents assign workers, compress timelines, and flag potential delays automatically.",
  },
  {
    icon: LayoutDashboard,
    title: "Monitor in real time",
    desc: "Track progress on the dashboard while Yojak recalibrates as conditions change.",
  },
];

const quickLinks = [
  { title: "Dashboard", href: "/demo/dashboard", icon: LayoutDashboard },
  { title: "Projects", href: "/demo/projects", icon: FolderKanban },
  { title: "Tasks", href: "/demo/tasks", icon: CheckSquare },
  { title: "Profile", href: "/demo/profile", icon: Users },
];

const adminLinks = [
  { title: "Users", icon: Users },
  { title: "Admins", icon: Shield },
  { title: "Agents", icon: Bot },
  { title: "Tools", icon: Wrench },
];

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const progress = useMemo(() => ((activeAgent + 1) / agents.length) * 100, [activeAgent]);
  const internalEntryHref = isAuthenticated ? "/dashboard" : "/login";

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAgent((prev) => (prev + 1) % agents.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          isScrolled
            ? "border-border/80 bg-background/75 backdrop-blur-xl shadow-sm"
            : "border-border/70 bg-background/90 backdrop-blur-none"
        )}
      >
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <LogoLink className="flex items-center gap-3">
            <LogoMark className="h-10 w-10 rounded-2xl" />
            <div>
              <p className="text-lg font-semibold tracking-tight">Yojak AI</p>
              <p className="text-xs text-muted-foreground">Construction Intelligence Engine</p>
            </div>
          </LogoLink>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="#live-agent-execution">AI Pipeline</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Start Building</Link>
            </Button>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/60 text-muted-foreground md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-border/70 bg-background/95 p-4 md:hidden">
            <div className="space-y-2">
              <Link href="#live-agent-execution" className="block rounded-xl px-3 py-2 hover:bg-accent/60">
                AI Pipeline
              </Link>
              <Link href="/projects" className="block rounded-xl px-3 py-2 hover:bg-accent/60">
                Projects
              </Link>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <ThemeToggle />
                <Button variant="outline" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32">
          <div className="absolute inset-0 -z-10 opacity-60 dark:opacity-90">
            <div className="absolute left-[-140px] top-[-130px] h-[360px] w-[360px] rounded-full bg-red-700/14 blur-[120px] dark:bg-red-800/24" />
            <div className="absolute right-[-80px] top-[90px] h-[300px] w-[300px] rounded-full bg-red-600/10 blur-[120px] dark:bg-red-700/16" />
            <div className="architectural-grid absolute inset-0 opacity-25" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="glass-panel mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-foreground/80">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Generated Intelligence for Construction Teams</span>
              </div>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Autonomous <span className="gradient-text">AI Pipeline</span> for Project Execution
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Yojak AI transforms project input into a multi-agent execution plan with compliance checks,
                cost intelligence, scheduling, risk prediction, and diagram generation.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/register">Start Designing</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={internalEntryHref}>View Live Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mb-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-2xl border border-border/70 bg-card/70 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
            {[
              { value: "200+", label: "Teams onboarded" },
              { value: "40%", label: "Faster planning cycles" },
              { value: "3.2x", label: "Schedule compression" },
              { value: "92%", label: "On-time delivery rate" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-muted/30 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-primary">Features</p>
              <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
                Everything your team needs to ship on time
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature) => (
                <Card key={feature.title} className="border-border/70 bg-card/80 backdrop-blur">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-primary">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{feature.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-primary">How It Works</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">From description to schedule in minutes</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <Card key={step.title} className="relative border-border/70">
                <CardContent className="pt-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Step {index + 1}</p>
                  <h3 className="mb-3 text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="live-agent-execution" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <Card className="glass-strong border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-xl">
                <span>Live Agent Execution</span>
                <span className="text-sm font-medium text-primary">{Math.round(progress)}% Complete</span>
              </CardTitle>
              <CardDescription>AI is actively processing your project through 7 specialized agents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="h-2 bg-white/10" />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {agents.map((agent, idx) => {
                  const isActive = idx === activeAgent;
                  const isCompleted = idx < activeAgent;
                  return (
                    <div
                      key={agent.id}
                      className={cn(
                        "rounded-xl border p-3 transition-all",
                        isActive && "border-primary/40 bg-primary/10",
                        isCompleted && "border-emerald-400/30 bg-emerald-500/10",
                        !isActive && !isCompleted && "border-border/70 bg-card/60"
                      )}
                    >
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{isActive ? agent.message : isCompleted ? "Completed" : "Queued"}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">Why Teams Switch</p>
            <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
              More project control, fewer execution surprises
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                title: "Unified planning and execution",
                desc: "Move from requirement intake to assignable tasks in one connected workflow with fewer handoffs.",
              },
              {
                title: "Predictive risk coverage",
                desc: "Catch delays early with agent-driven signals on dependencies, materials, and schedule drift.",
              },
              {
                title: "Operational transparency",
                desc: "Give PMs, site engineers, and leadership a shared, always-current execution source of truth.",
              },
              {
                title: "Faster decision loops",
                desc: "Turn planning updates into action quickly with automated recommendations and status intelligence.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-border/70 bg-card/70">
                <CardHeader>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Workspace Access</CardTitle>
              <CardDescription>
                Click any section to view a demo interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="glass-panel group rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-red-400/30"
                  >
                    <link.icon className="mb-3 h-5 w-5 text-primary" />
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{link.title}</p>
                      <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Demo
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {adminLinks.map((link) => (
                  <Button key={link.title} size="sm" variant="outline" type="button">
                    <link.icon className="h-4 w-4" />
                    {link.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto mb-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-red-500/30 bg-gradient-to-br from-red-700 via-red-800 to-red-950 p-8 sm:p-12">
            <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-red-100/90">
                  Ready to evolve your studio?
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  Launch your next project with AI-native execution planning
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-100 sm:text-base">
                  Start with scope, constraints, and timeline goals. Yojak generates task sequencing,
                  assignment recommendations, and risk-aware execution paths your team can act on immediately.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button variant="secondary" asChild>
                    <Link href="/register">Initialize Workspace</Link>
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                {[
                  "Guided setup for your first live project",
                  "AI-generated task graph in minutes",
                  "Role-aware views for PMs and field teams",
                  "Continuous risk and delay intelligence",
                ].map((detail) => (
                  <div
                    key={detail}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-zinc-100 backdrop-blur"
                  >
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-muted/20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <LogoMark className="h-8 w-8 rounded-lg" />
              <span className="font-semibold text-foreground">Yojak AI</span>
            </div>
            <p className="text-muted-foreground">
              AI-powered construction planning engine transforming project input into execution intelligence.
            </p>
          </div>
          <div className="space-y-3">
            <p className="font-medium text-foreground">Platform</p>
            <div className="space-y-2 text-muted-foreground">
              <Link href="/dashboard" className="block hover:text-foreground">Dashboard</Link>
              <Link href="/projects" className="block hover:text-foreground">Projects</Link>
              <Link href="/tasks" className="block hover:text-foreground">Tasks</Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-medium text-foreground">AI System</p>
            <div className="space-y-2 text-muted-foreground">
              <p>Agent Flow</p>
              <p>Generated Intelligence</p>
              <p>Execution Plan</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-medium text-foreground">Account</p>
            <div className="space-y-2 text-muted-foreground">
              <Link href="/login" className="block hover:text-foreground">Sign In</Link>
              <Link href="/register" className="block hover:text-foreground">Get Started</Link>
              <Link href="/forgot-password" className="block hover:text-foreground">Reset Password</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
            <p>&copy; {new Date().getFullYear()} Yojak AI. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span>Built for construction intelligence</span>
              <ChevronDown className="h-3 w-3 -rotate-90" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
