"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileDrawer } from "@/components/layout/MobileDrawer";

/**
 * Root Layout untuk seluruh sub-rute /dashboard/*
 * Bertindak sebagai persistent layout shell di Next.js 14 App Router.
 * Menjamin Header, Sidebar, dan MobileBottomNav tetap terpasang di memori
 * tanpa unmount/remount saat berpindah antar halaman (Beranda, Pelanggan, Keuangan, dll).
 */
export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-9 h-9 border-3 border-brand-gold-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Memverifikasi sesi pengguna...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-surface-bg antialiased selection:bg-brand-maroon-800 selection:text-white overflow-hidden print:h-auto print:min-h-0 print:bg-white print:overflow-visible">
      {/* Sticky Fixed Header */}
      <div className="flex-shrink-0 z-30 print:hidden">
        <AppHeader onOpenMobileDrawer={() => setMobileDrawerOpen(true)} />
      </div>

      {/* Body Container */}
      <div className="flex-1 flex overflow-hidden print:overflow-visible">
        {/* Desktop Sidebar (Fixed and Pinned on left, never moves) */}
        <div className="hidden md:flex flex-shrink-0 h-full print:hidden">
          <AppSidebar />
        </div>

        {/* Main Workspace Area: The ONLY area that scrolls */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-28 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full print:p-0 print:m-0 print:max-w-none print:w-full print:overflow-visible">
          {children}
        </main>
      </div>

      {/* Mobile Slide-out Drawer */}
      <div className="print:hidden">
        <MobileDrawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />
      </div>

      {/* Mobile Docked Bottom Navigation Bar */}
      <div className="print:hidden">
        <MobileBottomNav
          isMenuOpen={mobileDrawerOpen}
          onOpenMenu={() => setMobileDrawerOpen(true)}
        />
      </div>
    </div>
  );
}
