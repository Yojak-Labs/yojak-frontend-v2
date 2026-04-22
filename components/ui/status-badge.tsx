import { cn } from "@/lib/utils";
import type { ProjectStatus, TaskStatus, TaskPriority } from "@/lib/types";

interface StatusBadgeProps {
  status: ProjectStatus | TaskStatus | string;
  className?: string;
}

const statusColors: Record<string, string> = {
  // Project statuses
  planned: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  on_hold: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  // Task statuses
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  // Generic
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  pending: "Pending",
  blocked: "Blocked",
  active: "Active",
  inactive: "Inactive",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status] || statusColors.pending;
  const label =
    statusLabels[status] || (typeof status === "string" ? status.replace(/_/g, " ") : "Unknown");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: TaskPriority | string;
  className?: string;
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colorClass = priorityColors[priority] || priorityColors.medium;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        colorClass,
        className
      )}
    >
      {priority}
    </span>
  );
}
