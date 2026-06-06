import Link from "next/link";
import { cn } from "@/lib/utils";

const ACCENTS: Record<string, string> = {
  indigo:  "text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  emerald: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  amber:   "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  purple:  "text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  red:     "text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20",
  blue:    "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  zinc:    "text-zinc-700 dark:text-zinc-300 bg-zinc-500/10 border-zinc-500/20",
};

interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional sub-text under value (e.g. "+12% from last week") */
  hint?: string;
  Icon?: any;
  accent?: keyof typeof ACCENTS;
  /** If provided, the card becomes a link */
  href?: string;
  className?: string;
}

export function StatCard({ label, value, hint, Icon, accent = "indigo", href, className }: StatCardProps) {
  const inner = (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 transition-all duration-200",
        href && "hover:border-indigo-500/40 hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        {Icon && (
          <div className={cn("h-9 w-9 rounded-xl border flex items-center justify-center shrink-0", ACCENTS[accent])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums mt-3 truncate">{value}</p>
      {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
