import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ResellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/reseller");
  if (session.user.role !== "RESELLER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
