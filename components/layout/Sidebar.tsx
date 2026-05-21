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
  Users,
  Settings,
  PlusCircle,
  List,
  CheckSquare,
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
  { href: "/orders", label: "My Orders", icon: ShoppingCart, roles: ["BUYER", "ADMIN"] },
  { href: "/publisher", label: "My Sites", icon: List, roles: ["PUBLISHER", "ADMIN"] },
  { href: "/publisher/new", label: "Add Site", icon: PlusCircle, roles: ["PUBLISHER", "ADMIN"] },
  { href: "/admin", label: "Admin Panel", icon: Shield, roles: ["ADMIN"] },
  { href: "/admin/publishers", label: "Publishers", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/metrics", label: "Update Metrics", icon: BarChart2, roles: ["ADMIN"] },
  { href: "/admin/orders", label: "All Orders", icon: CheckSquare, roles: ["ADMIN"] },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "BUYER";

  const filtered = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <aside className="w-60 shrink-0 hidden lg:flex flex-col bg-white border-r border-gray-200 min-h-screen pt-6">
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
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
