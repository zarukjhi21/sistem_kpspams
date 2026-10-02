"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { DEMO_KPSPAMS_LIST, DEMO_USERS } from "@/lib/demo-data";
import {
  Droplet,
  Building2,
  LogOut,
  ChevronDown,
  Check,
  RefreshCw,
  Menu,
  Shield,
  Sparkles,
} from "lucide-react";

interface AppHeaderProps {
  onOpenMobileDrawer?: () => void;
}

export function AppHeader({ onOpenMobileDrawer }: AppHeaderProps) {
  const { user, activeKpspamsId, isDesaLevel, switchKpspamsContext, switchUserPersona, logout } = useAuth();
  const [contextDropdownOpen, setContextDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Left: Mobile Hamburger + Brand & Active Context */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-brand-maroon-800 hover:bg-slate-100 transition focus:outline-none"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-maroon-800 to-brand-maroon-900 border border-brand-gold-500/40 text-brand-gold-400 flex items-center justify-center shadow-md shadow-brand-maroon-900/10 group-hover:scale-105 transition-transform">
            <Droplet className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-extrabold text-brand-maroon-900 tracking-tight leading-none">
                SI-KPSPAMS
              </span>
              <span className="text-[10px] text-brand-gold-600 font-extrabold px-1.5 py-0.5 rounded-md bg-amber-50 border border-brand-gold-300 leading-none">
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
                  setPersonaDropdownOpen(false);
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

                  {DEMO_KPSPAMS_LIST.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => {
                        switchKpspamsContext(k.id);
                        setContextDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                        activeKpspamsId === k.id
                          ? "font-bold text-brand-maroon-800 bg-brand-maroon-50/60"
                          : "text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{k.name}</div>
                        <div className="text-[10px] text-slate-400">{k.dusuns.join(", ")}</div>
                      </div>
                      {activeKpspamsId === k.id && <Check className="w-4 h-4 text-brand-maroon-800" />}
                    </button>
                  ))}
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

      {/* Right: Quick Persona Switcher & User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Persona Switcher Dropdown (Essential for testing roles) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setPersonaDropdownOpen(!personaDropdownOpen);
              setContextDropdownOpen(false);
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-semibold shadow-sm transition"
            title="Klik untuk simulasi peran pengguna"
          >
            <RefreshCw className="w-3 h-3 text-amber-700" />
            <span className="hidden sm:inline font-normal text-amber-800">Peran:</span>
            <span className="font-bold max-w-[100px] truncate">{user?.roleLabel}</span>
            <ChevronDown className="w-3 h-3 text-amber-600" />
          </button>

          {personaDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                <span>Simulasi Hak Akses Pengguna</span>
                <Sparkles className="w-3 h-3 text-brand-gold-500" />
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUserPersona(u.id);
                      setPersonaDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                      user?.id === u.id
                        ? "font-bold text-brand-maroon-800 bg-brand-maroon-50/60"
                        : "text-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-800">{u.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                        <span className="font-medium text-brand-maroon-700">{u.roleLabel}</span>
                        <span>•</span>
                        <span className="truncate">{u.kpspamsName}</span>
                      </div>
                    </div>
                    {user?.id === u.id && <Check className="w-4 h-4 text-brand-maroon-800" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 pl-2 border-l border-slate-200">
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center text-brand-maroon-900 font-extrabold text-xs shadow-inner"
            title={`${user?.name} (${user?.roleLabel})`}
          >
            {user?.name.charAt(0) || "U"}
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
            title="Keluar dari sistem"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
