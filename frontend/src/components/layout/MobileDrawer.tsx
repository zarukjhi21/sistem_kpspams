"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DEMO_KPSPAMS_LIST } from "@/lib/demo-data";
import {
  X,
  Droplet,
  LayoutDashboard,
  Users,
  Activity,
  Receipt,
  Wallet,
  AlertCircle,
  Globe,
  Building2,
  Check,
  RefreshCw,
  LogOut,
  ChevronRight,
  Shield,
  UserCheck,
  Smartphone,
  Map,
  MessageCircle,
} from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const { user, activeKpspamsId, isDesaLevel, switchKpspamsContext, logout } = useAuth();
  const [showKpspamsList, setShowKpspamsList] = React.useState(false);

  if (!isOpen) return null;

  const isPetugas = user?.role === "petugas_lapangan";
  const isPelanggan = user?.role === "pelanggan";
  const isPengurus =
    user?.role === "ketua_kpspams" ||
    user?.role === "admin_kpspams" ||
    user?.role === "bendahara_kpspams";

  const getNavGroups = () => {
    if (isPelanggan) {
      return [
        {
          title: "Layanan Warga",
          items: [
            { label: "Portal Mandiri Warga", href: "/portal", icon: Globe },
            { label: "Pengaduan Layanan Air", href: "/dashboard/pengaduan", icon: AlertCircle },
          ],
        },
      ];
    }

    if (isPetugas) {
      return [
        {
          title: "Operasional Lapangan",
          items: [
            { label: "Beranda Ringkasan", href: "/dashboard", icon: LayoutDashboard },
            { label: "Pelanggan & SR (Dusun)", href: "/dashboard/pelanggan", icon: Users },
            { label: "Peta GIS Desa Kuajang", href: "/dashboard/peta-gis", icon: Map },
            { label: "Catat & Tagih di Tempat", href: "/dashboard/penagihan-lapangan", icon: Smartphone },
            { label: "Billing & Broadcast WA", href: "/dashboard/billing", icon: MessageCircle },
          ],
        },
        {
          title: "Layanan & Kas",
          items: [
            { label: "Buku Kas Setoran", href: "/dashboard/keuangan", icon: Wallet },
            { label: "Pengaduan & SPK Lapangan", href: "/dashboard/pengaduan", icon: AlertCircle },
          ],
        },
      ];
    }

    if (isPengurus) {
      return [
        {
          title: "Menu Utama",
          items: [
            { label: "Dashboard Unit", href: "/dashboard", icon: LayoutDashboard },
            { label: "Pelanggan & Sambungan", href: "/dashboard/pelanggan", icon: Users },
            { label: "Peta GIS Desa Kuajang", href: "/dashboard/peta-gis", icon: Map },
            { label: "Catat & Tagih di Tempat", href: "/dashboard/penagihan-lapangan", icon: Smartphone },
            { label: "Billing & Broadcast WA", href: "/dashboard/billing", icon: MessageCircle },
          ],
        },
        {
          title: "Keuangan & Kas",
          items: [
            { label: "Buku Kas & Saldo Unit", href: "/dashboard/keuangan", icon: Wallet },
          ],
        },
        {
          title: "Operasional & Layanan",
          items: [
            { label: "Pengaduan & SPK Teknisi", href: "/dashboard/pengaduan", icon: AlertCircle },
            { label: "Portal Mandiri Warga", href: "/portal", icon: Globe },
          ],
        },
      ];
    }

    // Default: Super Admin & Admin Desa
    return [
      {
        title: "Menu Utama",
        items: [
          { label: "Dashboard Ringkasan", href: "/dashboard", icon: LayoutDashboard },
          { label: "Pelanggan & Sambungan", href: "/dashboard/pelanggan", icon: Users },
          { label: "Peta GIS Desa Kuajang", href: "/dashboard/peta-gis", icon: Map },
          { label: "Catat & Tagih di Tempat", href: "/dashboard/penagihan-lapangan", icon: Smartphone },
          { label: "Billing & Broadcast WA", href: "/dashboard/billing", icon: MessageCircle },
        ],
      },
      {
        title: "Keuangan & Kas",
        items: [
          { label: "Buku Kas & Saldo Awal", href: "/dashboard/keuangan", icon: Wallet },
        ],
      },
      {
        title: "Operasional & Layanan",
        items: [
          { label: "Pengaduan & SPK Teknisi", href: "/dashboard/pengaduan", icon: AlertCircle },
          { label: "Portal Mandiri Warga", href: "/portal", icon: Globe },
        ],
      },
      {
        title: "Sistem & Administrasi",
        items: [
          { label: "Pengguna & Hak Akses", href: "/dashboard/pengguna", icon: UserCheck },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu Navigasi Seluler"
      className="md:hidden fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Sheet */}
      <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-slate-900 text-slate-200 h-full shadow-2xl flex flex-col z-10 border-l border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-brand-gold-500/40 shadow bg-slate-950 flex items-center justify-center">
              <Image
                src="/logo.jpg"
                alt="Logo SI-KPSPAMS Kuajang"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-tight">SI-KPSPAMS</span>
              <span className="text-[10px] text-brand-gold-400 font-bold ml-1.5 px-1.5 py-0.5 rounded bg-brand-gold-950/80 border border-brand-gold-500/30">
                KUAJANG
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Active User Persona Banner */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-brand-maroon-800 text-white font-bold text-xs flex items-center justify-center border border-brand-gold-500/50">
                {user?.name.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-white leading-tight truncate">{user?.name}</div>
                <div className="text-[11px] text-amber-300 font-medium">{user?.roleLabel}</div>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-400 flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-brand-gold-500" />
              <span className="truncate">{user?.kpspamsName || "Unit KPSPAMS"}</span>
            </div>
          </div>

          {/* KPSPAMS Scope Selector (For Desa Level) */}
          {isDesaLevel && (
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Lingkup KPSPAMS Aktif:
                </span>
                <button
                  onClick={() => setShowKpspamsList(!showKpspamsList)}
                  className="text-[11px] text-brand-gold-400 hover:underline font-semibold"
                >
                  {showKpspamsList ? "Tutup" : "Ganti"}
                </button>
              </div>

              <div className="text-xs font-semibold text-white flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-gold-500" />
                <span className="truncate">
                  {activeKpspamsId === null
                    ? "Konsolidasi Seluruh Desa"
                    : DEMO_KPSPAMS_LIST.find((k) => k.id === activeKpspamsId)?.name}
                </span>
              </div>

              {showKpspamsList && (
                <div className="mt-3 pt-2 border-t border-slate-700/60 space-y-1">
                  <button
                    onClick={() => {
                      switchKpspamsContext(null);
                      setShowKpspamsList(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      activeKpspamsId === null ? "bg-brand-maroon-800 text-white font-bold" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span>Konsolidasi Seluruh Desa (3 KPSPAMS)</span>
                    {activeKpspamsId === null && <Check className="w-3.5 h-3.5 text-brand-gold-400" />}
                  </button>
                  {DEMO_KPSPAMS_LIST.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => {
                        switchKpspamsContext(k.id);
                        setShowKpspamsList(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                        activeKpspamsId === k.id ? "bg-brand-maroon-800 text-white font-bold" : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{k.name}</span>
                      {activeKpspamsId === k.id && <Check className="w-3.5 h-3.5 text-brand-gold-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Items List */}
          <nav className="space-y-4">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? "bg-brand-maroon-800 text-white font-bold shadow-sm border-l-4 border-brand-gold-500 pl-2"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? "text-brand-gold-400" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[10px] text-slate-400">
            <div>SI-KPSPAMS v1.0</div>
            <div>Desa Kuajang, Kec. Binuang</div>
          </div>
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
