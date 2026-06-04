"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ShoppingCart, Globe, LogOut,
  ChevronDown, Menu, X, Zap, Shield, BarChart2, Sparkles, LogIn,
} from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const role = session?.user?.role;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const roleBadge: Record<string, string> = {
    ADMIN: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20",
    MANAGER: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20",
    PUBLISHER: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    BUYER: "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700",
  };

  const navLinks = [
    { href: "/marketplace", label: "Marketplace" },
    ...(session ? [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/orders", label: "Orders" },
    ] : []),
    ...(role === "PUBLISHER" ? [{ href: "/publisher", label: "My Sites" }] : []),
    ...(role === "MANAGER" ? [{ href: "/admin", label: "Manager" }] : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-lg shadow-zinc-900/5 dark:shadow-black/20"
          : "border-b border-transparent bg-zinc-50/40 dark:bg-zinc-950/40 backdrop-blur-md"
      )}
    >
      {/* gradient hairline */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-indigo-500 blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Zap className="h-5 w-5 text-white" fill="currentColor" />
              </div>
            </div>
            <span className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight">
              Link<span className="text-indigo-700 dark:text-indigo-400">Market</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive(item.href)}
                className={cn(
                  "nav-link px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
                  isActive(item.href) ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <ThemeToggle />
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200"
                >
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden lg:block max-w-[120px] truncate">
                    {session.user?.name ?? session.user?.email}
                  </span>
                  {role && (
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md hidden lg:block", roleBadge[role])}>
                      {role}
                    </span>
                  )}
                  <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-500 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-zinc-900/12 dark:shadow-black/50 border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 origin-top-right animate-scale-in">
                      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-0.5">Signed in as</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{session.user?.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
                      </div>
                      {[
                        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                        { href: "/orders", label: "My Orders", icon: ShoppingCart },
                        ...(role === "PUBLISHER" ? [{ href: "/publisher", label: "My Sites", icon: Globe }] : []),
                        ...(role === "MANAGER" ? [
                          { href: "/admin", label: "Manager Panel", icon: BarChart2 },
                          { href: "/admin/metrics", label: "Update Metrics", icon: BarChart2 },
                        ] : []),
                        ...(role === "ADMIN" ? [
                          { href: "/admin", label: "Admin Panel", icon: Shield },
                          { href: "/admin/metrics", label: "Update Metrics", icon: BarChart2 },
                        ] : []),
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Icon className="h-4 w-4" /> {item.label}
                          </Link>
                        );
                      })}
                      <div className="border-t border-zinc-200 dark:border-zinc-800 mt-1 pt-1">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/5 transition-colors w-full"
                        >
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="shine">
                    <Sparkles className="h-3.5 w-3.5" /> Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
          <button
            aria-label="Toggle menu"
            className="md:hidden relative h-10 w-10 grid place-items-center rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="sr-only">Menu</span>
            <Menu className={cn("hamburger-line absolute h-5 w-5", menuOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100")} />
            <X className={cn("hamburger-line absolute h-5 w-5", menuOpen ? "opacity-100" : "opacity-0 -rotate-90 scale-50")} />
          </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden border-t transition-all duration-300 ease-out bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-xl",
          menuOpen ? "max-h-[80vh] border-zinc-200 dark:border-zinc-800 opacity-100" : "max-h-0 border-transparent opacity-0"
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ transitionDelay: menuOpen ? `${i * 40}ms` : "0ms" }}
              className={cn(
                "flex items-center justify-between py-3 px-3 text-sm font-medium rounded-xl transition-all duration-300",
                isActive(item.href)
                  ? "bg-indigo-500/10 text-indigo-700 dark:text-white border border-indigo-500/20"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60",
                menuOpen ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0"
              )}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
              <ChevronDown className="h-4 w-4 -rotate-90 text-zinc-400 dark:text-zinc-600" />
            </Link>
          ))}

          <div className="pt-3 mt-2 border-t border-zinc-200 dark:border-zinc-800">
            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 w-full py-3 px-3 text-sm font-medium text-red-700 dark:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full">
                    <LogIn className="h-4 w-4" /> Login
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}>
                  <Button size="md" className="w-full">
                    <Sparkles className="h-4 w-4" /> Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
