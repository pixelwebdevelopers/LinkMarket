"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronRight } from "lucide-react";

export interface PanelNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Mark as exact match — otherwise we match prefix */
  exact?: boolean;
  /** Optional badge content (e.g. unread count) */
  badge?: string | number;
}

export interface PanelNavSection {
  title?: string;
  items: PanelNavItem[];
}

interface PanelShellProps {
  /** The section title shown at the top of the sidebar (e.g. "Admin Panel") */
  brand: string;
  /** Subtle label under the brand */
  brandSubtitle?: string;
  nav: PanelNavSection[];
  children: React.ReactNode;
}

export function PanelShell({ brand, brandSubtitle, nav, children }: PanelShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (item: PanelNavItem) => {
    if (item.exact) return pathname === item.href;
    if (item.href === "/") return pathname === "/";
    if (item.href === "/admin/sites" && pathname.startsWith("/admin/sites/bulk")) return false;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile top bar (sticky, below global navbar) */}
      <div className="lg:hidden sticky top-16 z-30 flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur">
        <button
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 grid place-items-center rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{brand}</p>
          {brandSubtitle && <p className="text-xs text-zinc-500 truncate">{brandSubtitle}</p>}
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col sticky top-16 self-start h-[calc(100vh-4rem)] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <SidebarContent brand={brand} brandSubtitle={brandSubtitle} nav={nav} isActive={isActive} />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 animate-slide-in flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{brand}</p>
                  {brandSubtitle && <p className="text-xs text-zinc-500 truncate">{brandSubtitle}</p>}
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 grid place-items-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SidebarContent brand={brand} brandSubtitle={brandSubtitle} nav={nav} isActive={isActive} hideBrand />
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  brand,
  brandSubtitle,
  nav,
  isActive,
  hideBrand,
}: {
  brand: string;
  brandSubtitle?: string;
  nav: PanelNavSection[];
  isActive: (item: PanelNavItem) => boolean;
  hideBrand?: boolean;
}) {
  return (
    <>
      {!hideBrand && (
        <div className="px-5 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{brand}</p>
          {brandSubtitle && <p className="text-xs text-zinc-500 truncate mt-0.5">{brandSubtitle}</p>}
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {nav.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active ? "text-indigo-700 dark:text-indigo-400" : "text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white"
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={cn(
                            "px-1.5 min-w-[1.25rem] h-5 grid place-items-center text-[10px] font-bold rounded-full",
                            active
                              ? "bg-indigo-500 text-white"
                              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {active && <ChevronRight className="h-3.5 w-3.5 text-indigo-500" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
