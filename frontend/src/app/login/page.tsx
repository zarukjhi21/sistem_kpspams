"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  ArrowRight,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Globe,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/demo-data";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("admin.desa");
  const [password, setPassword] = useState("Kuajang2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const success = await login(username.trim(), password);
      if (success) {
        const savedUser = localStorage.getItem("auth_user");
        let isPelanggan = false;
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            isPelanggan = u.role === "pelanggan";
          } catch {
            // fallback
          }
        }
        if (isPelanggan) {
          router.push("/portal");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError("Username atau kata sandi tidak valid. Silakan periksa kembali.");
      }
    } catch {
      setError("Terjadi kesalahan saat otentikasi. Silakan periksa koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword("Kuajang2026!");
    setError(null);
  };

  const handleQuickLogin = async (demoUsername: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const success = await login(demoUsername, "Kuajang2026!");
      if (success) {
        const found = DEMO_USERS.find((u) => u.username === demoUsername);
        if (found?.role === "pelanggan") {
          router.push("/portal");
        } else {
          router.push("/dashboard");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickRoles = [
    {
      username: "admin.desa",
      label: "Admin Desa",
      sub: "Operator TI Konsolidasi",
      badge: "Desa",
      color: "border-brand-maroon-300 text-brand-maroon-900 bg-brand-maroon-50/70",
    },
    {
      username: "ketua.lemobaru",
      label: "Ketua LMB",
      sub: "KPSPAMS Lemo Baru",
      badge: "LMB",
      color: "border-slate-300 text-slate-800 bg-slate-50",
    },
    {
      username: "bendahara.lemobaru",
      label: "Bendahara LMB",
      sub: "Buku Kas & Setoran",
      badge: "Kas",
      color: "border-emerald-300 text-emerald-900 bg-emerald-50/70",
    },
    {
      username: "petugas.lemobaru",
      label: "Petugas Lapangan",
      sub: "Catat Meter & Tagih",
      badge: "Operasional",
      color: "border-sky-300 text-sky-900 bg-sky-50/70",
    },
    {
      username: "warga.yusuf",
      label: "Portal Warga",
      sub: "Muhammad Yusuf (LMB)",
      badge: "Warga",
      color: "border-amber-300 text-amber-900 bg-amber-50/80",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-hidden selection:bg-brand-maroon-800 selection:text-white">
      {/* Background Decorative Auras (Subtle, Light, Premium) */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-brand-maroon-200/40 via-brand-gold-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[500px] h-[300px] bg-brand-gold-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar: Navigation back to home / portal */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between z-10 pt-2 pb-4">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-brand-maroon-900 transition px-2.5 py-1.5 rounded-lg hover:bg-white/80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Beranda Utama</span>
        </Link>

        <Link
          href="/portal"
          className="inline-flex items-center space-x-1 text-xs font-bold text-brand-maroon-800 hover:text-brand-maroon-950 transition px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs"
        >
          <Globe className="w-3.5 h-3.5 text-brand-gold-600" />
          <span>Portal Warga</span>
        </Link>
      </header>

      {/* Main Centered Unified Login Card (Single-Pane, Focused) */}
      <main className="max-w-md w-full mx-auto my-auto z-10">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-300/40 p-6 sm:p-8 relative">
          {/* Institutional Top Accents */}
          <div className="w-full h-1.5 bg-gradient-to-r from-brand-maroon-900 via-brand-maroon-700 to-brand-gold-500 rounded-t-3xl absolute top-0 left-0 right-0" />

          {/* Logo & Header Title */}
          <div className="text-center pt-2 pb-5">
            <div className="inline-flex justify-center mb-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-gold-500/60 shadow-lg shadow-brand-maroon-950/10 bg-slate-950 flex items-center justify-center p-0.5 group hover:scale-105 transition-transform">
                <Image
                  src="/logo.jpg"
                  alt="Logo Resmi SI-KPSPAMS Kuajang"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-brand-maroon-50 text-brand-maroon-900 border border-brand-maroon-200/80 mb-2">
              <span>Desa Kuajang</span>
              <span className="text-slate-300">•</span>
              <span className="text-brand-gold-700">Kec. Binuang</span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              SI-KPSPAMS KUAJANG
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Sistem Informasi Terpadu Pengelolaan Air Minum & Sanitasi Perdesaan
            </p>
          </div>

          {/* Quick Persona Role Selector Pills (1-Tap Fast Fill) */}
          <div className="mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold-600" />
                <span>Pilih Hak Akses Cepat (1-Tap):</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Klik untuk mengisi</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {quickRoles.slice(0, 4).map((r) => {
                const isActive = username === r.username;
                return (
                  <button
                    key={r.username}
                    type="button"
                    onClick={() => handleQuickSelect(r.username)}
                    className={`p-2 text-left rounded-xl border transition-all text-xs flex flex-col justify-between ${
                      isActive
                        ? "bg-brand-maroon-800 text-white border-brand-maroon-800 shadow-sm"
                        : `${r.color} hover:shadow-xs active:scale-95`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${isActive ? "text-white" : ""}`}>
                        {r.label}
                      </span>
                      {isActive && <CheckCircle2 className="w-3 h-3 text-brand-gold-400" />}
                    </div>
                    <span
                      className={`text-[10px] truncate mt-0.5 ${
                        isActive ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {r.sub}
                    </span>
                  </button>
                );
              })}

              {/* Portal Warga Single Wide Pill */}
              <button
                type="button"
                onClick={() => handleQuickSelect("warga.yusuf")}
                className={`col-span-2 p-2 text-left rounded-xl border transition-all text-xs flex items-center justify-between ${
                  username === "warga.yusuf"
                    ? "bg-brand-maroon-800 text-white border-brand-maroon-800 shadow-sm"
                    : "bg-amber-50/90 border-amber-200 text-amber-950 hover:bg-amber-100 active:scale-95"
                }`}
              >
                <div>
                  <span className="font-bold flex items-center gap-1.5">
                    <span>💧 Portal Mandiri Warga</span>
                  </span>
                  <span
                    className={`text-[10px] block ${
                      username === "warga.yusuf" ? "text-slate-200" : "text-amber-800"
                    }`}
                  >
                    Akun Pelanggan: Muhammad Yusuf (Dusun Lemo Baru)
                  </span>
                </div>
                {username === "warga.yusuf" ? (
                  <CheckCircle2 className="w-4 h-4 text-brand-gold-400" />
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                    Pelanggan
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 cursor-pointer"
              >
                Username / Akun Petugas
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-800 focus:border-brand-maroon-800 font-medium text-slate-900 transition"
                  placeholder="Contoh: admin.desa"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer"
                >
                  Kata Sandi
                </label>
                <span className="text-[10px] text-slate-400">Default: Kuajang2026!</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-800 focus:border-brand-maroon-800 font-medium text-slate-900 transition font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-maroon-800 via-brand-maroon-900 to-black hover:from-brand-maroon-900 hover:to-black shadow-md shadow-brand-maroon-950/20 active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-maroon-800 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-gold-400 border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                </>
              )}
            </button>
          </form>

          {/* Institutional Trust Notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sanctum SSL Token</span>
            </span>
            <span className="text-slate-400 font-medium">Multi-Tenant Terisolasi</span>
          </div>
        </div>
      </main>

      {/* Clean Footer Bar */}
      <footer className="max-w-md w-full mx-auto text-center z-10 pt-4 pb-2 text-[11px] text-slate-400">
        <p>© 2026 Pemerintah Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar.</p>
        <p className="text-[10px] text-slate-400/80 mt-0.5">
          SI-KPSPAMS KUAJANG • Rilis Resmi v1.0
        </p>
      </footer>
    </div>
  );
}
