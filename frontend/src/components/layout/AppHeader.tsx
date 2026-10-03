"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { DEMO_KPSPAMS_LIST } from "@/lib/demo-data";
import {
  Building2,
  LogOut,
  ChevronDown,
  Check,
  Menu,
} from "lucide-react";

interface AppHeaderProps {
  onOpenMobileDrawer?: () => void;
}

export function AppHeader({ onOpenMobileDrawer }: AppHeaderProps) {
  const { user, activeKpspamsId, isDesaLevel, switchKpspamsContext, logout } = useAuth();
  const [contextDropdownOpen, setContextDropdownOpen] = useState(false);

  return (
    <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-2.5 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Left: Mobile Hamburger + Brand & Active Context */}
      <div className="flex items-center space-x-1.5 sm:space-x-4 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="md:hidden p-1.5 rounded-xl text-slate-600 hover:text-brand-maroon-800 hover:bg-slate-100 transition focus:outline-none"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-2.5 group min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-brand-gold-500/50 shadow-md shadow-brand-maroon-900/10 group-hover:scale-105 transition-transform bg-slate-950 flex-shrink-0 flex items-center justify-center p-0.5">
            <Image
              src="/logo.jpg"
              alt="Logo SI-KPSPAMS Kuajang"
              width={36}
              height={36}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="text-xs sm:text-sm font-extrabold text-brand-maroon-900 tracking-tight leading-none whitespace-nowrap">
                SI-KPSPAMS
              </span>
              <span className="text-[9px] sm:text-[10px] text-brand-gold-600 font-extrabold px-1.5 py-0.5 rounded-md bg-amber-50 border border-brand-gold-300 leading-none whitespace-nowrap">
                KUAJANG
              </span>
            </div>
            <span className="hidden sm:block text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
              Kab. Polewali Mandar
            </span>
          </div>
        </Link>

        <div className="h-5 w-px bg-slate-200 hidden lg:block" />

        {/* KPSPAMS Scope Selector (Desktop & Tablet) */}
        <div className="relative hidden sm:block">
          {isDesaLevel ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  setContextDropdownOpen(!contextDropdownOpen);
                }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200/90 hover:border-brand-maroon-400 bg-slate-50/80 hover:bg-white text-xs font-semibold text-slate-700 transition shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Building2 className="w-3.5 h-3.5 text-brand-maroon-800" />
                <span className="max-w-[170px] lg:max-w-[220px] truncate">
                  {activeKpspamsId === null
                    ? "Konsolidasi Seluruh Desa"
                    : DEMO_KPSPAMS_LIST.find((k) => k.id === activeKpspamsId)?.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {contextDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Pilih Lingkup Wilayah KPSPAMS
                  </div>
                  <button
                    onClick={() => {
                      switchKpspamsContext(null);
                      setContextDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                      activeKpspamsId === null
                        ? "font-bold text-brand-maroon-800 bg-brand-maroon-50/60"
                        : "text-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-bold">Konsolidasi Seluruh Desa</div>
                      <div className="text-[10px] text-slate-400">Agregasi 3 KPSPAMS Aktif</div>
                    </div>
                    {activeKpspamsId === null && <Check className="w-4 h-4 text-brand-maroon-800" />}
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {DEMO_KPSPAMS_LIST.map((k) => {
                    const isLemoBaru = k.id === 1;
                    return (
                      <button
                        key={k.id}
                        disabled={!isLemoBaru}
                        onClick={() => {
                          if (isLemoBaru) {
                            switchKpspamsContext(k.id);
                            setContextDropdownOpen(false);
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition ${
                          !isLemoBaru ? "opacity-50 cursor-not-allowed bg-slate-50/50" : "hover:bg-slate-50"
                        } ${
                          activeKpspamsId === k.id
                            ? "font-bold text-brand-maroon-800 bg-brand-maroon-50/60"
                            : "text-slate-700"
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold">{k.name}</span>
                            {!isLemoBaru && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold">
                                🔒 Nonaktif Sementara
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{k.dusuns.join(", ")}</div>
                        </div>
                        {activeKpspamsId === k.id && <Check className="w-4 h-4 text-brand-maroon-800" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-brand-maroon-50 border border-brand-maroon-200/80 text-brand-maroon-900 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-brand-maroon-800" />
              <span className="truncate max-w-[140px]">{user?.kpspamsName || "Unit KPSPAMS"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: User Profile & Logout (Real Session) */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* User Info (Desktop) */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-900 leading-tight">
            {user?.name || "Operator Desa"}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {user?.roleLabel || "Petugas SI-KPSPAMS"}
          </span>
        </div>

        {/* User Avatar */}
        <div
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-maroon-800 to-brand-maroon-950 text-white font-extrabold text-xs shadow-md shadow-brand-maroon-900/10 flex items-center justify-center border border-brand-gold-500/30"
          title={`${user?.name} (${user?.roleLabel})`}
        >
          {user?.name?.charAt(0) || "U"}
        </div>

        {/* Logout Action */}
        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition text-xs font-semibold"
          title="Keluar dari sistem"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span className="hidden md:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
