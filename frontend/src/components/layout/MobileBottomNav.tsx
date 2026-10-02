"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Activity, Receipt, Menu, Smartphone, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface MobileBottomNavProps {
  onOpenMenu: () => void;
  isMenuOpen: boolean;
}

export function MobileBottomNav({ onOpenMenu, isMenuOpen }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isPetugas = user?.role === "petugas_lapangan";

  const navItems = [
    {
      label: "Beranda",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      label: "Pelanggan",
      href: "/dashboard/pelanggan",
      icon: Users,
      isActive: pathname.startsWith("/dashboard/pelanggan"),
    },
    {
      label: "Catat & Tagih",
      href: "/dashboard/penagihan-lapangan",
      icon: Smartphone,
      isActive: pathname.startsWith("/dashboard/penagihan-lapangan"),
      highlight: true, // Special centered FAB style on mobile
    },
    {
      label: "Buku Kas",
      href: "/dashboard/keuangan",
      icon: Wallet,
      isActive: pathname.startsWith("/dashboard/keuangan"),
    },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Seluler"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 safe-area-inset-bottom"
    >
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Item 1: Beranda */}
        <Link
          href={navItems[0].href}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition min-w-[56px] min-h-[48px] ${
            navItems[0].isActive
              ? "text-brand-maroon-800 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div
            className={`p-1 rounded-lg transition ${
              navItems[0].isActive ? "bg-brand-maroon-50 text-brand-maroon-800" : ""
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">{navItems[0].label}</span>
        </Link>

        {/* Item 2: Pelanggan */}
        <Link
          href={navItems[1].href}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition min-w-[56px] min-h-[48px] ${
            navItems[1].isActive
              ? "text-brand-maroon-800 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div
            className={`p-1 rounded-lg transition ${
              navItems[1].isActive ? "bg-brand-maroon-50 text-brand-maroon-800" : ""
            }`}
          >
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">{navItems[1].label}</span>
        </Link>

        {/* Center Prominent Item: Catat Meter (Touch-friendly Field Meter Button) */}
        <Link
          href={navItems[2].href}
          className="flex flex-col items-center -mt-5 min-w-[60px] group"
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              navItems[2].isActive
                ? "bg-brand-maroon-800 text-brand-gold-400 ring-4 ring-brand-maroon-100 shadow-brand-maroon-900/30"
                : "bg-brand-maroon-800 text-white shadow-brand-maroon-900/20 group-hover:scale-105"
            }`}
          >
            <Activity className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] mt-1 font-semibold ${
              navItems[2].isActive ? "text-brand-maroon-800 font-bold" : "text-slate-600"
            }`}
          >
            {navItems[2].label}
          </span>
        </Link>

        {/* Item 4: Kasir */}
        <Link
          href={navItems[3].href}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition min-w-[56px] min-h-[48px] ${
            navItems[3].isActive
              ? "text-brand-maroon-800 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div
            className={`p-1 rounded-lg transition ${
              navItems[3].isActive ? "bg-brand-maroon-50 text-brand-maroon-800" : ""
            }`}
          >
            <Receipt className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">{navItems[3].label}</span>
        </Link>

        {/* Item 5: Menu Drawer Button */}
        <button
          type="button"
          onClick={onOpenMenu}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition min-w-[56px] min-h-[48px] ${
            isMenuOpen
              ? "text-brand-maroon-800 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div
            className={`p-1 rounded-lg transition ${
              isMenuOpen ? "bg-brand-maroon-50 text-brand-maroon-800" : ""
            }`}
          >
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
