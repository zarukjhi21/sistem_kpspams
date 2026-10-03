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
  Globe,
  ArrowLeft,
  CheckCircle2,
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

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-x-hidden selection:bg-brand-maroon-800 selection:text-white">
      {/* Background Soft Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-brand-maroon-200/30 via-brand-gold-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between z-10 pb-2">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-brand-maroon-900 transition px-2.5 py-1.5 rounded-lg hover:bg-white/80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        <Link
          href="/portal"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-brand-maroon-900 transition px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300"
        >
          <Globe className="w-3.5 h-3.5 text-brand-gold-600" />
          <span>Portal Warga</span>
        </Link>
      </header>

      {/* Main Centered Login Card */}
      <main className="max-w-md w-full mx-auto my-auto z-10">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-7 sm:p-8 relative">
          {/* Institutional Top Accent Border */}
          <div className="w-full h-1 bg-gradient-to-r from-brand-maroon-800 via-brand-maroon-600 to-brand-gold-500 rounded-t-2xl absolute top-0 left-0 right-0" />

          {/* Header Branding - Strict Vertical Flex Alignment */}
          <div className="flex flex-col items-center text-center pt-2 pb-6 border-b border-slate-100">
            {/* Centered Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-brand-gold-500/60 shadow-md bg-slate-950 flex items-center justify-center p-0.5 mb-3 group hover:scale-105 transition-transform">
              <Image
                src="/logo.jpg"
                alt="Logo Resmi SI-KPSPAMS Kuajang"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            {/* Region Pill */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-maroon-50 text-brand-maroon-900 border border-brand-maroon-200/70 mb-2">
              <span>Desa Kuajang</span>
              <span className="text-slate-300">•</span>
              <span className="text-brand-gold-700">Kec. Binuang</span>
            </div>

            {/* System Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              SI-KPSPAMS KUAJANG
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Sistem Informasi Pengelolaan Air Minum & Sanitasi Perdesaan
            </p>
          </div>

          {/* Login Form - Primary Focus */}
          <form className="space-y-4 pt-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 mb-1.5 cursor-pointer"
              >
                Username Petugas / ID Pelanggan
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-800 focus:border-brand-maroon-800 font-medium text-slate-900 transition"
                  placeholder="Masukkan username akun"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Kata Sandi
                </label>
                <span className="text-[11px] text-slate-400">Default: Kuajang2026!</span>
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
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-800 focus:border-brand-maroon-800 font-medium text-slate-900 transition font-mono"
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
              className="w-full mt-2 flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-maroon-800 hover:bg-brand-maroon-900 active:scale-[0.99] transition shadow-md shadow-brand-maroon-950/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-maroon-800 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
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
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1 text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Tenant Terisolasi</span>
            </span>
            <span>Sanctum SSL</span>
          </div>
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="max-w-md w-full mx-auto text-center z-10 pt-4 pb-2 text-[11px] text-slate-400">
        <p>© 2026 Pemerintah Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar</p>
      </footer>
    </div>
  );
}
