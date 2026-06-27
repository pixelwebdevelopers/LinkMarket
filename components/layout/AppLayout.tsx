"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, ShoppingCart, Globe, LogOut,
  ChevronDown, Menu, X, Shield, Sparkles, LogIn,
  Wallet, Building2, Users, UserCog, BarChart3, Activity, Settings, AlertTriangle, LifeBuoy,
  PlusCircle, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Read collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored === "true") setCollapsed(true);
    } catch (e) {}
  }, []);

  // Sync mobile menu close on path change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("sidebar-collapsed", String(next));
    } catch (e) {}
  };

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  // Loading state (avoids layout flash)
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Not authenticated or on public auth pages: show standard layout (Navbar hidden on auth pages)
  if (!session || isAuthPage) {
    return (
      <>
        {!isAuthPage && <Navbar />}
        <main>{children}</main>
      </>
    );
  }

  const role = session.user?.role ?? "CUSTOMER";

  // Sidebar structures by perspective
  const sections: SidebarSection[] = [
    {
      title: "Customer Perspective",
      links: [
        { href: "/marketplace", label: "Marketplace", icon: Globe },
        { href: "/dashboard", label: "Dashboard Overview", icon: LayoutDashboard, exact: true },
        { href: "/orders?roleScope=customer", label: "Orders Bought", icon: ShoppingCart },
        { href: "/support", label: "Get Support", icon: LifeBuoy },
      ],
    },
  ];

  if (role === "RESELLER") {
    sections.push({
      title: "Reseller Perspective",
      links: [
        { href: "/reseller", label: "My Sites", icon: Globe, exact: true },
        { href: "/reseller/new", label: "Submit Site", icon: PlusCircle },
        { href: "/reseller/bulk", label: "Bulk Import", icon: Upload },
        { href: "/orders?roleScope=reseller", label: "Orders Received", icon: ShoppingCart },
        { href: "/reseller/earnings", label: "Earnings & Wallet", icon: Wallet },
        { href: "/reseller/bank-accounts", label: "Bank Accounts", icon: Building2 },
      ],
    });
  }

  if (role === "ADMIN") {
    sections.push({
      title: "Admin Perspective",
      links: [
        { href: "/admin", label: "Admin Overview", icon: Shield, exact: true },
        { href: "/admin/sites", label: "Manage Sites", icon: Globe },
        { href: "/admin/orders", label: "Manage Orders", icon: ShoppingCart },
        { href: "/admin/disputes", label: "Manage Disputes", icon: AlertTriangle },
        { href: "/admin/resellers", label: "Resellers List", icon: Users },
        { href: "/admin/customers", label: "Customers List", icon: UserCog },
        { href: "/admin/payouts", label: "Payout Requests", icon: Wallet },
        { href: "/admin/settings", label: "Global Settings", icon: Settings },
        { href: "/admin/audit", label: "Audit Log", icon: Activity },
      ],
    });
  }

  const isLinkActive = (item: SidebarLink) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "&") || pathname.startsWith(item.href + "/");
  };

  const currentSectionTitle = () => {
    if (pathname.startsWith("/admin")) return "Admin Panel";
    if (pathname.startsWith("/reseller")) return "Reseller Panel";
    return "Customer Panel";
  };

  const sidebarContent = (hideCollapseButton = false) => (
    <div className="flex-1 flex flex-col justify-between h-full bg-slate-900 text-slate-300">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand/Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-xl bg-indigo-500 blur-sm opacity-50 group-hover:opacity-80 transition-opacity" />
              <Image
                src="/logo.png"
                alt="Rankistic"
                width={32}
                height={32}
                priority
                className="relative h-8 w-8 rounded-lg bg-white object-contain p-0.5 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {!collapsed && (
              <span className="font-bold text-white tracking-tight text-base animate-fade-in truncate">
                Rankistic
              </span>
            )}
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6 scrollbar-none">
          {sections.map((section, si) => (
            <div key={si} className="space-y-1">
              {!collapsed ? (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 truncate animate-fade-in">
                  {section.title}
                </p>
              ) : (
                <div className="h-px bg-slate-800 my-4 mx-2" />
              )}
              <ul className="space-y-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active = isLinkActive(link);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        title={collapsed ? link.label : undefined}
                        className={cn(
                          "group flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                          collapsed ? "justify-center p-2.5" : "px-3 py-2.5 gap-3",
                          active
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-white" : "text-zinc-400 group-hover:text-white")} />
                        {!collapsed && <span className="truncate flex-1">{link.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Collapse button bottom */}
      {!hideCollapseButton && (
        <div className="p-2 border-t border-slate-800/80">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Desktop Sidebar (Left) */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 border-r border-slate-800/80 bg-slate-900 sticky top-0 h-screen transition-all duration-300 z-40",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer (Overlay) */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800/80 animate-slide-in flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800/80 bg-slate-900 text-white">
              <span className="font-bold tracking-tight">Menu Navigation</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sidebarContent(true)}
            </div>
          </aside>
        </>
      )}

      {/* Right side container */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden h-10 w-10 grid place-items-center rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 hidden sm:block">
              {currentSectionTitle()}
            </h2>
          </div>

          {/* Quick Actions (Right) */}
          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200"
              >
                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
                  {session.user?.name?.[0] ?? session.user?.email?.[0]}
                </div>
                <div className="text-left hidden md:block max-w-[120px]">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                    {session.user?.name ?? session.user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide leading-none mt-0.5">
                    {role}
                  </p>
                </div>
                <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 shrink-0", userMenuOpen && "rotate-180")} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 origin-top-right animate-scale-in">
                    <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                      <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider mb-0.5">
                        {role} Dashboard
                      </p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {session.user?.name ?? "Rankistic User"}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
                    </Link>

                    <div className="border-t border-zinc-200 dark:border-zinc-800 mt-1 pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/5 transition-colors w-full text-left"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
