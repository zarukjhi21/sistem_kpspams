"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/penagihan-lapangan");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6 text-slate-500 text-xs">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-brand-gold-500 border-t-transparent animate-spin mx-auto" />
        <p>Mengalihkan ke sistem terpadu Catat & Tagih Lapangan...</p>
      </div>
    </div>
  );
}
