"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResellerBulkImportPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/reseller");
  }, [router]);
  return null;
}
