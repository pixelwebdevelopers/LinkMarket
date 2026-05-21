import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "manager";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default:  "bg-zinc-800 text-zinc-300 border border-zinc-700",
    success:  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning:  "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    danger:   "bg-red-500/10 text-red-400 border border-red-500/20",
    info:     "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    purple:   "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    manager:  "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
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
