"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ShoppingCart, Globe, Settings, LogOut,
  ChevronDown, Menu, X, Zap, Shield, Users, BarChart2,
} from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const role = session?.user?.role;

  const roleColor: Record<string, string> = {
    ADMIN: "text-red-400",
    MANAGER: "text-indigo-400",
    PUBLISHER: "text-emerald-400",
    BUYER: "text-zinc-400",
  };

  const roleBadge: Record<string, string> = {
    ADMIN: "bg-red-500/10 text-red-400 border border-red-500/20",
    MANAGER: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    PUBLISHER: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    BUYER: "bg-zinc-800 text-zinc-400 border border-zinc-700",
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:bg-indigo-500 transition-colors">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Link<span className="text-indigo-400">Market</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/marketplace", label: "Marketplace" },
              ...(session ? [
                { href: "/dashboard", label: "Dashboard" },
                { href: "/orders", label: "Orders" },
              ] : []),
              ...(role === "PUBLISHER" ? [{ href: "/publisher", label: "My Sites" }] : []),
              ...(role === "MANAGER" ? [{ href: "/admin", label: "Manager" }] : []),
              ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-all duration-150"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200"
                >
                  <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                    {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-300 hidden lg:block max-w-[120px] truncate">
                    {session.user?.name ?? session.user?.email}
                  </span>
                  {role && (
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md hidden lg:block", roleBadge[role])}>
                      {role}
                    </span>
                  )}
                  <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-500 transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-zinc-900 rounded-2xl shadow-2xl shadow-black/50 border border-zinc-800 py-1.5 z-50">
                      <div className="px-4 py-3 border-b border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-0.5">Signed in as</p>
                        <p className="text-sm font-semibold text-white truncate">{session.user?.name}</p>
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
                        { href: "/settings", label: "Settings", icon: Settings },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Icon className="h-4 w-4" /> {item.label}
                          </Link>
                        );
                      })}
                      <div className="border-t border-zinc-800 mt-1 pt-1">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors w-full"
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
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1">
          {[
            { href: "/marketplace", label: "Marketplace" },
            ...(session ? [{ href: "/dashboard", label: "Dashboard" }, { href: "/orders", label: "Orders" }] : []),
            ...(role === "PUBLISHER" ? [{ href: "/publisher", label: "My Sites" }] : []),
            ...((role === "ADMIN" || role === "MANAGER") ? [{ href: "/admin", label: role === "ADMIN" ? "Admin" : "Manager" }] : []),
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="block py-2.5 px-3 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {session ? (
            <button
              onClick={() => signOut()}
              className="block w-full text-left py-2.5 px-3 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Sign out
            </button>
          ) : (
            <>
              <Link href="/login" className="block py-2.5 px-3 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/register" className="block py-2.5 px-3 text-sm font-medium text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors" onClick={() => setMenuOpen(false)}>Get Started →</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
