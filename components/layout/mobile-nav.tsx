"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Shield,
  Bot,
  Wrench,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoLink } from "@/components/layout/logo-link";
import { LogoMark } from "@/components/layout/logo-mark";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
];

const adminNavItems: NavItem[] = [
  { title: "Users", href: "/admin/users", icon: Users, adminOnly: true },
  { title: "Admins", href: "/admin/admins", icon: Shield, adminOnly: true },
  { title: "Agents", href: "/admin/agents", icon: Bot, adminOnly: true },
  { title: "Tools", href: "/admin/tools", icon: Wrench, adminOnly: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    authApi.logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const readText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

  const getDisplayName = () => {
    if (!user) return "User";
    const userRecord = user as unknown as Record<string, unknown>;
    const directName = readText(user.name);
    if (directName) return directName;

    const fullName = readText(userRecord.fullName) || readText(userRecord.full_name);
    if (fullName) return fullName;

    const firstName = readText(user.firstName) || readText(userRecord.first_name);
    const lastName = readText(user.lastName) || readText(userRecord.last_name);
    const combinedName = `${firstName} ${lastName}`.trim();
    if (combinedName) return combinedName;

    const username = readText(userRecord.username) || readText(userRecord.userName);
    if (username) return username;

    const email = readText(user.email);
    if (email) return email.split("@")[0];

    return "User";
  };

  const displayName = getDisplayName();

  return (
    <div className="md:hidden flex items-center justify-between h-16 px-4 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <LogoLink className="flex items-center gap-2">
        <LogoMark className="h-8 w-8 rounded-xl" />
        <span className="text-lg font-semibold">Yojak AI</span>
      </LogoLink>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-border/70 bg-background/95 p-0 backdrop-blur-2xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <LogoLink
              className="flex h-16 items-center gap-2 border-b border-white/10 px-6"
              onClick={() => setOpen(false)}
            >
              <LogoMark className="h-8 w-8 rounded-xl" />
              <span className="text-lg font-semibold">Yojak AI</span>
            </LogoLink>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
              <nav className="space-y-1 px-3">
                <div className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Main
                </div>
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                        isActive
                          ? "bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-accent-foreground"
                          : "text-foreground hover:bg-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  );
                })}

                {isAdmin && (
                  <>
                    <div className="mt-6 mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Admin
                    </div>
                    {adminNavItems.map((item) => {
                      const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                            isActive
                              ? "bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-accent-foreground"
                              : "text-foreground hover:bg-accent/50"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.title}
                        </Link>
                      );
                    })}
                  </>
                )}
              </nav>
            </ScrollArea>

            {/* User section */}
            <div className="border-t border-white/10 p-3 space-y-1">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-accent/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-primary-foreground text-xs">
                    {getInitials(displayName) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <User className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Log out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}
