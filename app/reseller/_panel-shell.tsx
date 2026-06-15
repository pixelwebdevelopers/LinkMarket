"use client";

import { PanelShell, type PanelNavSection } from "@/components/panel/PanelShell";
import { Globe, PlusCircle, Wallet, Building2, ShoppingCart, Upload } from "lucide-react";

const nav: PanelNavSection[] = [
  {
    title: "Your sites",
    items: [
      { href: "/reseller", label: "Sites", icon: Globe, exact: true },
      { href: "/reseller/new", label: "Submit site", icon: PlusCircle, exact: true },
      { href: "/reseller/bulk", label: "Bulk import", icon: Upload, exact: true },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/orders", label: "Orders", icon: ShoppingCart },
    ],
  },
  {
    title: "Money",
    items: [
      { href: "/reseller/earnings", label: "Earnings", icon: Wallet },
      { href: "/reseller/bank-accounts", label: "Bank accounts", icon: Building2 },
    ],
  },
];

export default function ResellerPanelShell({
  children,
  brandSubtitle,
}: {
  children: React.ReactNode;
  brandSubtitle?: string;
}) {
  return (
    <PanelShell brand="Reseller" brandSubtitle={brandSubtitle} nav={nav}>
      {children}
    </PanelShell>
  );
}
