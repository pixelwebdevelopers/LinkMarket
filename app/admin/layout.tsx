import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminPanelShell from "./_panel-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return <AdminPanelShell>{children}</AdminPanelShell>;
}
