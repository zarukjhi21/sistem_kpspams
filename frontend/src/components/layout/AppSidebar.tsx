"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Activity,
  Receipt,
  AlertCircle,
  Wallet,
  Globe,
  Building2,
  ShieldCheck,
  UserCheck,
  Smartphone,
  MessageCircle,
  Map,
} from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role;

  const getNavGroups = () => {
    // 1. Pelanggan / Warga Biasa
    if (role === "pelanggan") {
      return [
        {
          category: "Layanan Warga",
          items: [
            { label: "Portal Warga Mandiri", href: "/portal", icon: Globe },
            { label: "Pengaduan Layanan Air", href: "/dashboard/pengaduan", icon: AlertCircle },
          ],
        },
      ];
    }

    // 2. Bendahara / Kasir KPSPAMS (Fokus Finansial & Kasir Saja)
    if (role === "bendahara_kpspams") {
      return [
        {
          category: "Utama",
          items: [
            { label: "Dashboard Unit", href: "/dashboard", icon: LayoutDashboard },
          ],
        },
        {
          category: "Keuangan & Kasir",
          items: [
            { label: "Buku Kas & Saldo Unit", href: "/dashboard/keuangan", icon: Wallet },
            { label: "Status Iuran & Tagihan", href: "/dashboard/billing", icon: MessageCircle },
          ],
        },
        {
          category: "Layanan Warga",
          items: [
            { label: "Portal Warga Mandiri", href: "/portal", icon: Globe },
          ],
        },
      ];
    }

    // 3. Petugas Lapangan (Fokus Catat Meter, Cek Titik Fisik & Tagih Lapangan)
    if (role === "petugas_lapangan") {
      return [
        {
          category: "Operasional Lapangan",
          items: [
            { label: "Catat & Tagih di Tempat", href: "/dashboard/penagihan-lapangan", icon: Smartphone },
            { label: "Pelanggan & SR Dusun", href: "/dashboard/pelanggan", icon: Users },
            { label: "Peta GIS Sambungan Air", href: "/dashboard/peta-gis", icon: Map },
          ],
        },
        {
          category: "Layanan Lapangan",
          items: [
            { label: "Lapor Aduan / Pipa Bocor", href: "/dashboard/pengaduan", icon: AlertCircle },
            { label: "Portal Warga Mandiri", href: "/portal", icon: Globe },
          ],
        },
      ];
    }

    // 4. Sekretaris & Admin Unit KPSPAMS (Fokus Administrasi SR, Broadcast WA, SPK)
    if (role === "admin_kpspams") {
      return [
        {
          category: "Utama",
          items: [
            { label: "Dashboard Unit", href: "/dashboard", icon: LayoutDashboard },
          ],
        },
        {
          category: "Administrasi Sambungan",
          items: [
            { label: "Register Pelanggan & SR", href: "/dashboard/pelanggan", icon: Users },
            { label: "Billing & Broadcast WA", href: "/dashboard/billing", icon: MessageCircle },
            { label: "Peta GIS Desa Kuajang", href: "/dashboard/peta-gis", icon: Map },
          ],
        },
        {
          category: "Layanan Warga",
          items: [
            { label: "Pengaduan & SPK", href: "/dashboard/pengaduan", icon: AlertCircle },
            { label: "Portal Warga", href: "/portal", icon: Globe },
          ],
        },
      ];
    }

    // 5. Ketua KPSPAMS (Supervisi Operasional & Keuangan Unit)
    if (role === "ketua_kpspams") {
      return [
        {
          category: "Utama",
          items: [
            { label: "Dashboard Unit", href: "/dashboard", icon: LayoutDashboard },
          ],
        },
        {
          category: "Pengawasan Operasional",
          items: [
            { label: "Pelanggan & Sambungan", href: "/dashboard/pelanggan", icon: Users },
            { label: "Billing & Status Iuran", href: "/dashboard/billing", icon: MessageCircle },
            { label: "Peta GIS Desa Kuajang", href: "/dashboard/peta-gis", icon: Map },
          ],
        },
        {
          category: "Keuangan Unit",
          items: [
            { label: "Buku Kas & Saldo Unit", href: "/dashboard/keuangan", icon: Wallet },
          ],
        },
        {
          category: "Layanan Warga",
          items: [
            { label: "Pengaduan Layanan Air", href: "/dashboard/pengaduan", icon: AlertCircle },
            { label: "Portal Warga", href: "/portal", icon: Globe },
          ],
        },
      ];
    }

    // 6. Kepala Desa (Supervisi Eksekutif Tingkat Desa, Laporan LPJ & Peta GIS)
    if (role === "pemerintah_desa") {
      return [
        {
          category: "Utama",
          items: [
            { label: "Dashboard Eksekutif Desa", href: "/dashboard", icon: LayoutDashboard },
          ],
        },
        {
          category: "Pengawasan & Transparansi",
          items: [
            { label: "Buku Kas & Laporan LPJ", href: "/dashboard/keuangan", icon: Wallet },
            { label: "Peta Master GIS Desa", href: "/dashboard/peta-gis", icon: Map },
            { label: "Data Pelanggan 3 Unit", href: "/dashboard/pelanggan", icon: Users },
          ],
        },
        {
          category: "Layanan Warga",
          items: [
            { label: "Pengaduan Warga Desa", href: "/dashboard/pengaduan", icon: AlertCircle },
            { label: "Portal Transparansi Publik", href: "/portal", icon: Globe },
          ],
        },
      ];
    }

    // 7. Default: Super Admin & Admin Desa (Akses Penuh Seluruh Sistem)
    return [
      {
        category: "Utama",
        items: [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        category: "Jaringan & Lapangan",
        items: [
          { label: "Pelanggan & SR", href: "/dashboard/pelanggan", icon: Users },
          { label: "Peta GIS Desa Kuajang", href: "/dashboard/peta-gis", icon: Map },
          { label: "Catat & Tagih di Tempat", href: "/dashboard/penagihan-lapangan", icon: Smartphone },
          { label: "Billing & Broadcast WA", href: "/dashboard/billing", icon: MessageCircle },
        ],
      },
      {
        category: "Keuangan & Kas",
        items: [
          { label: "Buku Kas & Saldo", href: "/dashboard/keuangan", icon: Wallet },
        ],
      },
      {
        category: "Layanan Warga",
        items: [
          { label: "Pengaduan & SPK", href: "/dashboard/pengaduan", icon: AlertCircle },
          { label: "Portal Warga", href: "/portal", icon: Globe },
        ],
      },
      {
        category: "Sistem & Akses",
        items: [
          { label: "Pengguna & Hak Akses", href: "/dashboard/pengguna", icon: UserCheck },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col h-full border-r border-slate-800 selection:bg-brand-maroon-800">
      {/* Navigation Groups */}
      <div className="p-4 flex-1 space-y-6 overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              {group.category}
            </div>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-brand-maroon-800 to-brand-maroon-900 text-white shadow-md shadow-brand-maroon-950/40 font-bold border-l-4 border-brand-gold-500 pl-2.5"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-brand-gold-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Role & Scope Footer (Pinned at Bottom of Sidebar) */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex-shrink-0">
        <div className="flex items-center space-x-2 mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-gold-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Hak Akses Aktif
          </span>
        </div>
        <div className="text-xs font-bold text-white tracking-tight">
          {user?.roleLabel}
        </div>
        <div className="text-[11px] text-amber-400/90 truncate mt-0.5 flex items-center space-x-1">
          <Building2 className="w-3 h-3 text-amber-500 flex-shrink-0" />
          <span className="truncate">{user?.kpspamsName}</span>
        </div>
      </div>
    </aside>
  );
}
