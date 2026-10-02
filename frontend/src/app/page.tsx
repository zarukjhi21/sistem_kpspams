import React from "react";
import Link from "next/link";
import {
  Droplet,
  ShieldCheck,
  Activity,
  Users,
  FileText,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle,
  Receipt,
  Wallet,
} from "lucide-react";
import { PublicTransparencyCharts } from "@/components/charts/PublicTransparencyCharts";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-brand-maroon-800 selection:text-white">
      {/* Header Bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-maroon-800 to-brand-maroon-900 border border-brand-gold-500/50 text-brand-gold-400 flex items-center justify-center shadow-lg">
              <Droplet className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-extrabold tracking-tight text-white">SI-KPSPAMS</span>
                <span className="text-[10px] text-brand-gold-400 font-extrabold px-1.5 py-0.5 rounded bg-brand-gold-950/80 border border-brand-gold-500/40">
                  KUAJANG
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Desa Kuajang, Kec. Binuang, Polman</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/portal"
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold text-amber-300 hover:text-white transition"
            >
              Portal Warga
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-gradient-to-r from-brand-gold-500 to-amber-500 hover:from-brand-gold-600 hover:to-amber-600 text-brand-maroon-950 text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition active:scale-95 flex items-center space-x-1.5"
            >
              <span>Masuk Sistem</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-10 sm:space-y-14">
        {/* Hero Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-brand-maroon-950/70 to-slate-900 border border-slate-800/90 p-6 sm:p-10 lg:p-12 shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-maroon-600/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-gold-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-maroon-900/80 border border-brand-maroon-700/80 text-brand-gold-400 text-xs font-bold mb-4">
              <ShieldCheck className="w-4 h-4 text-brand-gold-400" />
              <span>Multi-Tenant KPSPAMS Terisolasi Mandiri</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Pengelolaan Transparan & Akuntabel Air Bersih Perdesaan
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
              Platform modern pencatatan stand meter digital, validasi anomali mundur, billing tarif bertingkat, kwitansi QR kasir, dan integrasi pengaduan warga di seluruh 5 dusun Desa Kuajang.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-maroon-800 to-brand-maroon-900 hover:from-brand-maroon-900 hover:to-black text-white text-sm font-bold shadow-xl shadow-brand-maroon-950/50 border border-brand-maroon-700 text-center transition active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Akses Pengelola KPSPAMS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/portal"
                className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-sm font-semibold border border-slate-700 text-center transition active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Portal Mandiri Cek Tagihan Warga</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Unit KPSPAMS Grid */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">Unit Pengelola KPSPAMS Desa Kuajang</h3>
            <p className="text-xs text-slate-400">Pembagian wilayah layanan air bersih mandiri per unit</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Unit 1 */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-maroon-900/90 text-brand-gold-300 border border-brand-maroon-700">
                  Unit 1 (LMB)
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Operasional</span>
                </span>
              </div>
              <h4 className="text-base font-extrabold text-white">KPSPAMS Lemo Baru</h4>
              <p className="text-xs text-slate-400">
                Wilayah Layanan: <strong className="text-slate-200">Dusun Lemo Baru</strong>
              </p>
              <div className="pt-2 border-t border-slate-700/60 text-xs text-slate-400 flex justify-between">
                <span>Pelanggan Aktif:</span>
                <span className="font-bold text-white">185 SR</span>
              </div>
            </div>

            {/* Unit 2 */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-maroon-900/90 text-brand-gold-300 border border-brand-maroon-700">
                  Unit 2 (LMT)
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Operasional</span>
                </span>
              </div>
              <h4 className="text-base font-extrabold text-white">KPSPAMS Lemo Tua</h4>
              <p className="text-xs text-slate-400">
                Wilayah Layanan: <strong className="text-slate-200">Dusun Lemo Tua</strong>
              </p>
              <div className="pt-2 border-t border-slate-700/60 text-xs text-slate-400 flex justify-between">
                <span>Pelanggan Aktif:</span>
                <span className="font-bold text-white">142 SR</span>
              </div>
            </div>

            {/* Unit 3 */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-maroon-900/90 text-brand-gold-300 border border-brand-maroon-700">
                  Unit 3 (SRP)
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Operasional</span>
                </span>
              </div>
              <h4 className="text-base font-extrabold text-white">KPSPAMS Sarampu 1</h4>
              <p className="text-xs text-slate-400">
                Wilayah Layanan: <strong className="text-slate-200">Dusun Sarampu 1 & Dusun Pakkandoang</strong>
              </p>
              <div className="pt-2 border-t border-slate-700/60 text-xs text-slate-400 flex justify-between">
                <span>Pelanggan Aktif:</span>
                <span className="font-bold text-white">210 SR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Public Transparency & Performance Charts */}
        <PublicTransparencyCharts />

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-900/60 hover:bg-slate-800/60 transition p-5 rounded-2xl border border-slate-800 flex items-start space-x-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-maroon-800/40 to-brand-maroon-950/80 border border-brand-maroon-700/60 text-brand-gold-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-maroon-950/30 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 stroke-[2.2] drop-shadow-[0_2px_4px_rgba(217,119,6,0.3)]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-gold-300 transition-colors">Catat Meter Mobile</h4>
              <p className="text-xs text-slate-400 mt-1">
                Optimasi HP lapangan, validasi stand mundur, & foto dial meter.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 hover:bg-slate-800/60 transition p-5 rounded-2xl border border-slate-800 flex items-start space-x-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5 stroke-[2.2] drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">Billing Engine Fleksibel</h4>
              <p className="text-xs text-slate-400 mt-1">
                Tarif independen per KPSPAMS dan kwitansi kasir QR digital.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 hover:bg-slate-800/60 transition p-5 rounded-2xl border border-slate-800 flex items-start space-x-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 stroke-[2.2] drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Audit Kas & Saldo Awal</h4>
              <p className="text-xs text-slate-400 mt-1">
                Koreksi transaksi kasir tanpa hard delete (Void T+0) & jejak audit.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 hover:bg-slate-800/60 transition p-5 rounded-2xl border border-slate-800 flex items-start space-x-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/40 text-sky-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/10 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 stroke-[2.2] drop-shadow-[0_2px_4px_rgba(14,165,233,0.3)]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">Portal Warga Mandiri</h4>
              <p className="text-xs text-slate-400 mt-1">
                Akses cek tagihan, histori 6 bulan, dan pengaduan gangguan via ponsel.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Pemerintah Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar.</p>
          <p className="text-slate-500">SI-KPSPAMS KUAJANG v1.0 • Enterprise Architecture</p>
        </div>
      </footer>
    </div>
  );
}
