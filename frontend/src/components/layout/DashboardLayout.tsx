"use client";

import React, { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileDrawer } from "@/components/layout/MobileDrawer";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
