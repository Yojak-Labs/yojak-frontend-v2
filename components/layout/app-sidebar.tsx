"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogoLink } from "@/components/layout/logo-link";
import { LogoMark } from "@/components/layout/logo-mark";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", href: "/projects", icon: FolderKanban },
];

const adminNavItems: NavItem[] = [
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Admins", href: "/admin/admins", icon: Shield },
  { title: "Agents", href: "/admin/agents", icon: Bot },
  { title: "Tools", href: "/admin/tools", icon: Wrench },
];

export function AppSidebar({ collapsed, onToggleCollapsed }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    authApi.logout();
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

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
    <aside
      className={cn(
        "hidden md:fixed md:inset-y-0 md:flex md:flex-col border-r border-white/15 bg-sidebar/70 backdrop-blur-2xl transition-all duration-300",
        collapsed ? "md:w-20" : "md:w-72"
      )}
    >
      <div className="flex flex-1 flex-col">
        <div
          className={cn(
            "flex h-16 items-center border-b border-white/15",
            collapsed ? "justify-center px-2" : "gap-2 px-6"
          )}
        >
          <LogoLink className={cn("flex items-center", collapsed ? "" : "gap-2 flex-1 min-w-0")}>
            <LogoMark className="h-9 w-9 rounded-xl" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-base font-semibold text-sidebar-foreground">Yojak AI</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent Flow</p>
              </div>
            )}
          </LogoLink>
          <Button variant="ghost" size="icon-sm" onClick={onToggleCollapsed} className="text-muted-foreground">
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {!collapsed && (
              <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Main
              </div>
            )}
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.title : undefined}
                  className={cn(
                    "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                    collapsed ? "justify-center" : "gap-3",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-sidebar-accent-foreground shadow-lg"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {!collapsed && item.title}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                {!collapsed && (
                  <div className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Admin
                  </div>
                )}
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.title : undefined}
                      className={cn(
                        "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                        collapsed ? "justify-center" : "gap-3",
                        isActive
                          ? "bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-sidebar-accent-foreground shadow-lg"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && item.title}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </ScrollArea>

        <div className="border-t border-white/15 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-auto py-2",
                  collapsed ? "w-full justify-center px-2" : "w-full justify-start gap-3 px-3"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-red-700 to-red-900 text-xs text-white">
                    {getInitials(displayName) || "U"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="truncate text-sm font-medium">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
