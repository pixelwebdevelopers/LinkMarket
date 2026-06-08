import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "admin";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default:  "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700",
    success:  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    warning:  "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    danger:   "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20",
    info:     "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
    purple:   "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20",
    admin:    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
