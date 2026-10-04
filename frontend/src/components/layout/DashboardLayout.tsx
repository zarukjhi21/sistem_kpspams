"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileDrawer } from "@/components/layout/MobileDrawer";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen flex flex-col bg-surface-bg antialiased selection:bg-brand-maroon-800 selection:text-white">
      {/* Sticky Header */}
      <AppHeader onOpenMobileDrawer={() => setMobileDrawerOpen(true)} />

      {/* Body Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <AppSidebar />

        {/* Main Workspace Area with responsive bottom padding for MobileBottomNav */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-28 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Slide-out Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Mobile Docked Bottom Navigation Bar */}
      <MobileBottomNav
        isMenuOpen={mobileDrawerOpen}
        onOpenMenu={() => setMobileDrawerOpen(true)}
      />
    </div>
  );
}
