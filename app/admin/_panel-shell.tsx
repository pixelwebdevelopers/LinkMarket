"use client";

import { PanelShell, type PanelNavSection } from "@/components/panel/PanelShell";
import {
  LayoutDashboard,
  Globe,
  Users,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  BarChart3,
  Activity,
  Settings,
  UserCog,
  Upload,
} from "lucide-react";

const nav: PanelNavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/admin/sites", label: "Sites", icon: Globe },
      { href: "/admin/sites/bulk", label: "Bulk import", icon: Upload, exact: true },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/resellers", label: "Resellers", icon: Users },
      { href: "/admin/customers", label: "Customers", icon: UserCog },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/payouts", label: "Payouts", icon: Wallet },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/admin/metrics", label: "Update Metrics", icon: BarChart3 },
      { href: "/admin/audit", label: "Audit Log", icon: Activity },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AdminPanelShell({ children }: { children: React.ReactNode }) {
  return (
    <PanelShell brand="Admin Panel" brandSubtitle="Platform operations" nav={nav}>
      {children}
    </PanelShell>
  );
}
