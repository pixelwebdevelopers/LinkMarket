import { cn } from "@/lib/utils";

interface EmptyStateProps {
  Icon?: any;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="h-14 w-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 grid place-items-center mb-4">
          <Icon className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
        </div>
      )}
      <p className="font-semibold text-zinc-900 dark:text-white">{title}</p>
      {description && <p className="text-sm text-zinc-500 mt-1.5 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5 inline-flex">{action}</div>}
    </div>
  );
}
