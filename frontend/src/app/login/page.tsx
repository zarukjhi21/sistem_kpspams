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
  Droplets,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Silakan masukkan username dan kata sandi Anda.");
      return;
    }

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
      setError("Terjadi kesalahan saat otentikasi. Silakan periksa koneksi internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-amber-50/20 flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-hidden selection:bg-brand-maroon-800 selection:text-white">
      {/* Subtle Background Glows & Water Theme Elements */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-brand-maroon-200/20 via-brand-gold-100/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-gold-200/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-maroon-200/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between z-10 pb-4">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-brand-maroon-900 transition px-3 py-1.5 rounded-xl hover:bg-white/80 border border-transparent hover:border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Kembali ke Beranda</span>
        </Link>

        <Link
          href="/portal"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-maroon-900 hover:text-brand-maroon-950 transition px-3.5 py-1.5 rounded-xl bg-white/90 backdrop-blur border border-slate-200/90 shadow-xs hover:shadow hover:border-brand-gold-400"
        >
          <Globe className="w-3.5 h-3.5 text-brand-gold-600 animate-pulse" />
          <span>Portal Warga</span>
        </Link>
      </header>

      {/* Main Centered Login Card */}
      <main className="max-w-md w-full mx-auto my-auto z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 p-7 sm:p-9 relative">
          {/* Institutional Top Accent Ribbon */}
          <div className="w-full h-1.5 bg-gradient-to-r from-brand-maroon-900 via-brand-maroon-700 to-brand-gold-500 rounded-t-3xl absolute top-0 left-0 right-0" />

          {/* Header Branding */}
          <div className="flex flex-col items-center text-center pt-2 pb-6 border-b border-slate-100">
            {/* Centered Logo with Ring */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-gold-500/70 shadow-lg shadow-brand-maroon-950/10 bg-slate-950 flex items-center justify-center p-0.5 mb-3.5 group hover:scale-105 transition-all duration-300">
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
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-maroon-50 text-brand-maroon-900 border border-brand-maroon-200/70 mb-2">
              <Droplets className="w-3 h-3 text-brand-maroon-700" />
              <span>Desa Kuajang</span>
              <span className="text-slate-300">•</span>
              <span className="text-brand-gold-700">Kec. Binuang</span>
            </div>

            {/* System Title */}
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              SI-KPSPAMS KUAJANG
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Sistem Informasi Pengelolaan Air Minum & Sanitasi Perdesaan
            </p>
          </div>

          {/* Active Scope Notice Banner */}
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-[11px] text-amber-900">
            <span className="flex items-center space-x-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Unit Aktif: <strong>KPSPAMS Lemo Baru</strong></span>
            </span>
            <span className="text-[10px] text-amber-700 font-semibold px-2 py-0.5 bg-amber-100 rounded-md">
              Desa Kuajang
            </span>
          </div>

          {/* Login Form */}
          <form className="space-y-4 pt-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-in fade-in flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 mb-1.5 cursor-pointer"
              >
                Username Petugas / Pengurus
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-800 focus:border-brand-maroon-800 font-medium text-slate-900 transition shadow-2xs placeholder:text-slate-400"
                  placeholder="Masukkan username akun dinas"
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
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-[11px] font-medium text-brand-maroon-800 hover:text-brand-maroon-900 hover:underline flex items-center space-x-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Bantuan Akun?</span>
                </button>
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
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-800 focus:border-brand-maroon-800 font-medium text-slate-900 transition shadow-2xs placeholder:text-slate-400"
                  placeholder="Masukkan kata sandi akun"
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

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-maroon-800 border-slate-300 focus:ring-brand-maroon-700 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 flex justify-center items-center space-x-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-maroon-900 via-brand-maroon-800 to-brand-maroon-900 hover:from-brand-maroon-950 hover:to-brand-maroon-850 active:scale-[0.99] transition shadow-lg shadow-brand-maroon-950/20 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-maroon-800 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
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
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5 text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Akses Terenkripsi SSL 256-bit</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">v2.6 Kuajang</span>
          </div>
        </div>

        {/* Portal Warga Quick Link */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-sm flex items-center justify-between text-xs text-amber-950">
          <div>
            <div className="font-bold text-slate-800">Warga / Pelanggan Air Bersih?</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Warga tidak perlu akun login, cukup cek dengan <strong>NIK KTP</strong>.</div>
          </div>
          <Link
            href="/portal"
            className="font-bold text-brand-maroon-800 hover:text-brand-maroon-900 transition px-3 py-1.5 rounded-xl bg-white border border-brand-gold-400 shadow-2xs hover:shadow flex items-center space-x-1 shrink-0 ml-3"
          >
            <span>Portal Warga</span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-gold-600" />
          </Link>
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="max-w-md w-full mx-auto text-center z-10 pt-4 pb-2 text-[11px] text-slate-400">
        <p>© 2026 Pemerintah Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar</p>
        <p className="text-[10px] text-slate-400/80 mt-0.5">Sistem Informasi Pengelolaan Air Minum dan Sanitasi Perdesaan</p>
      </footer>

      {/* Account Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-brand-maroon-50 text-brand-maroon-900">
                <HelpCircle className="w-5 h-5 text-brand-maroon-800" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bantuan Akses Petugas</h3>
                <p className="text-[11px] text-slate-500">KPSPAMS Lemo Baru - Desa Kuajang</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 mb-5">
              <p>
                Akses sistem ini diperuntukkan bagi pengurus KPSPAMS dan Pemerintah Desa Kuajang yang terdaftar.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1.5">
                <div className="font-semibold text-slate-800">Format Akun Petugas Lemo Baru:</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li><span className="font-mono text-slate-700">admin.lemobaru</span> (Admin Unit)</li>
                  <li><span className="font-mono text-slate-700">bendahara.lemobaru</span> (Keuangan)</li>
                  <li><span className="font-mono text-slate-700">petugas.lemobaru</span> (Catat Meter)</li>
                  <li><span className="font-mono text-slate-700">ketua.lemobaru</span> (Ketua Pengelola)</li>
                </ul>
              </div>
              <p className="text-[11px] text-slate-500">
                Jika Anda lupa kata sandi atau akun mengalami kendala, hubungi Administrator Desa Kuajang.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
