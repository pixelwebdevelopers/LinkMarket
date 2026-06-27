import { cn } from "@/lib/utils";

/** Padded, max-width container used inside PanelShell main area. */
export function PageContainer({
  children,
  className,
  width = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "wide" | "narrow";
}) {
  return (
    <div
      className={cn(
        "px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-fade-in w-full",
        className
      )}
    >
      {children}
    </div>
  );
}
