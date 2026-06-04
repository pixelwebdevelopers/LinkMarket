"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Globe,
  BarChart2,
  Shield,
  PlusCircle,
  List,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Globe },
  { href: "/orders", label: "My Orders", icon: ShoppingCart, roles: ["CUSTOMER", "RESELLER", "ADMIN"] },
  { href: "/reseller", label: "My Sites", icon: List, roles: ["RESELLER", "ADMIN"] },
  { href: "/reseller/new", label: "Add Site", icon: PlusCircle, roles: ["RESELLER", "ADMIN"] },
  { href: "/reseller/earnings", label: "Earnings", icon: BarChart2, roles: ["RESELLER"] },
  { href: "/reseller/bank-accounts", label: "Bank Accounts", icon: List, roles: ["RESELLER"] },
  { href: "/admin", label: "Admin Panel", icon: Shield, roles: ["ADMIN"] },
  { href: "/admin/resellers", label: "Resellers", icon: List, roles: ["ADMIN"] },
  { href: "/admin/payouts", label: "Payouts", icon: BarChart2, roles: ["ADMIN"] },
  { href: "/admin/disputes", label: "Disputes", icon: BarChart2, roles: ["ADMIN"] },
  { href: "/admin/metrics", label: "Update Metrics", icon: BarChart2, roles: ["ADMIN"] },
  { href: "/admin/audit", label: "Audit log", icon: BarChart2, roles: ["ADMIN"] },
  { href: "/admin/settings", label: "Settings", icon: BarChart2, roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "CUSTOMER";

  const filtered = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <aside className="w-60 shrink-0 hidden lg:flex flex-col bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 min-h-screen pt-6">
      <nav className="flex flex-col gap-1 px-3">
        {filtered.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
