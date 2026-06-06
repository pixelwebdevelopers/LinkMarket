import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ResellerPanelShell from "./_panel-shell";

export default async function ResellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/reseller");
  if (session.user.role !== "RESELLER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <ResellerPanelShell brandSubtitle={session.user.email ?? undefined}>{children}</ResellerPanelShell>;
}
