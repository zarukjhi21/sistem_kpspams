"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplet, ShieldCheck, Lock, ArrowRight, UserCheck, Sparkles, Building2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/demo-data";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("admin.desa");
  const [password, setPassword] = useState("Kuajang2026!");
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
        setError("Username atau kata sandi tidak valid.");
      }
    } catch {
      setError("Terjadi kesalahan saat otentikasi. Silakan periksa koneksi.");
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-maroon-700/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-gold-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-maroon-800 to-brand-maroon-900 border-2 border-brand-gold-500/50 text-brand-gold-400 flex items-center justify-center shadow-2xl shadow-brand-maroon-950">
            <Droplet className="w-8 h-8 fill-current" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          SI-KPSPAMS KUAJANG
        </h2>
        <p className="mt-1 text-xs text-amber-200/90 font-medium max-w-sm mx-auto">
          Sistem Informasi Pengelolaan KPSPAMS Desa Kuajang, Kec. Binuang
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-7 px-5 sm:px-8 shadow-2xl rounded-3xl border border-white/20">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 cursor-pointer">
                Username / Akun Pengguna
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-3.5 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 font-medium text-slate-800"
                  placeholder="Contoh: admin.desa"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 cursor-pointer">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 font-medium text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-maroon-800 to-brand-maroon-900 hover:from-brand-maroon-900 hover:to-black shadow-lg shadow-brand-maroon-900/20 active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-maroon-800"
            >
              <span>Masuk Aplikasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Persona Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-3">
              <div className="flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-brand-gold-600" />
                <span>Uji Coba Hak Akses Cepat (1-Tap):</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-brand-gold-500" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin.desa")}
                className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-brand-maroon-50/80 border border-slate-200/90 text-slate-700 font-medium transition active:scale-95"
              >
                <div className="font-extrabold text-brand-maroon-900">Admin Desa</div>
                <div className="text-[10px] text-slate-500">Agregat 3 KPSPAMS</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("ketua.lemobaru")}
                className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-brand-maroon-50/80 border border-slate-200/90 text-slate-700 font-medium transition active:scale-95"
              >
                <div className="font-extrabold text-brand-maroon-900">Ketua LMB</div>
                <div className="text-[10px] text-slate-500">KPSPAMS Lemo Baru</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("bendahara.lemobaru")}
                className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-brand-maroon-50/80 border border-slate-200/90 text-slate-700 font-medium transition active:scale-95"
              >
                <div className="font-extrabold text-brand-maroon-900">Bendahara LMB</div>
                <div className="text-[10px] text-slate-500">Kasir & Mutasi Kas</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("petugas.lemobaru")}
                className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-brand-maroon-50/80 border border-slate-200/90 text-slate-700 font-medium transition active:scale-95"
              >
                <div className="font-extrabold text-brand-maroon-900">Petugas Lapangan</div>
                <div className="text-[10px] text-slate-500">Input Catat Meter</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("warga.yusuf")}
                className="col-span-2 p-2.5 text-left rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 font-medium transition flex items-center justify-between active:scale-95"
              >
                <div>
                  <div className="font-extrabold">Portal Mandiri Warga</div>
                  <div className="text-[10px] text-amber-800">Muhammad Yusuf (Dusun Lemo Baru)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-800" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
