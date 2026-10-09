"use client";

import React from "react";

/**
 * DashboardLayout (Backward-Compatibility Passthrough Wrapper)
 * Shell persisten kini dikelola secara otomatis oleh Next.js App Router di app/dashboard/layout.tsx.
 * Komponen ini dipertahankan sebagai pass-through agar semua halaman dashboard tetap kompatibel
 * tanpa menduplikasi shell DOM dan tanpa menghapus/mengubah state halaman yang sudah ada.
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
