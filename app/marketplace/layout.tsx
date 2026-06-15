import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * The marketplace is gated: visitors must sign in (or create an account)
 * before they can browse listings. Unauthenticated requests are redirected
 * to login and returned here afterwards.
 */
export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/marketplace`);
  }
  return <>{children}</>;
}
