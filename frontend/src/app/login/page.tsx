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
  Globe,
  ArrowLeft,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-hidden selection:bg-sky-600 selection:text-white">
      {/* Subtle Background Glows & Water Theme Elements */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-sky-200/30 via-blue-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-200/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between z-10 pb-3 sm:pb-4">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-[11px] sm:text-xs font-semibold text-slate-600 hover:text-slate-900 transition px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-white/80 border border-transparent hover:border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Beranda</span>
        </Link>

        <Link
          href="/portal"
          className="inline-flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs font-semibold text-sky-800 hover:text-sky-950 transition px-3 sm:px-3.5 py-1.5 rounded-xl bg-white/90 backdrop-blur border border-slate-200/90 shadow-xs hover:shadow hover:border-sky-300"
        >
          <Globe className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          <span>Portal Warga</span>
        </Link>
      </header>

      {/* Main Centered Login Card */}
      <main className="max-w-md w-full mx-auto my-auto z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 p-5 sm:p-9 relative">
          {/* Institutional Top Accent Ribbon */}
          <div className="w-full h-1.5 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-600 rounded-t-2xl sm:rounded-t-3xl absolute top-0 left-0 right-0" />

          {/* Header Branding */}
          <div className="flex flex-col items-center text-center pt-2 pb-4 sm:pb-6 border-b border-slate-100">
            {/* Centered Logo with Ring */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-sky-500/60 shadow-lg shadow-slate-950/10 bg-slate-950 flex items-center justify-center p-0.5 mb-2.5 sm:mb-3.5 group hover:scale-105 transition-all duration-300">
              <Image
                src="/logo.jpg"
                alt="Logo Resmi SI-KPSPAMS Kuajang"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            {/* System Title */}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              SI-KPSPAMS KUAJANG
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Sistem Informasi Pengelolaan Air Minum & Sanitasi Perdesaan
            </p>
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 font-medium text-slate-900 transition shadow-2xs placeholder:text-slate-400"
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
                  className="text-[11px] font-medium text-sky-700 hover:text-sky-800 hover:underline flex items-center space-x-1"
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
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 font-medium text-slate-900 transition shadow-2xs placeholder:text-slate-400"
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
                  className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 flex justify-center items-center space-x-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition shadow-lg shadow-slate-900/20 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="max-w-md w-full mx-auto text-center z-10 pt-4 pb-2 text-[11px] text-slate-400 space-y-0.5">
        <p>© 2026 Pemerintah Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar</p>
        <p className="text-[10px] text-slate-400/80">Sistem Informasi Pengelolaan Air Minum dan Sanitasi Perdesaan</p>
        <p className="text-[10px] text-slate-400 pt-0.5">
          Dikembangkan oleh <span className="text-slate-300 font-semibold">Pua Kaso</span>
        </p>
      </footer>

      {/* Account Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-800">
                <HelpCircle className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bantuan Akses Petugas</h3>
                <p className="text-[11px] text-slate-500">KPSPAMS Lemo Baru - Desa Kuajang</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 mb-5">
              <p>
                Akses sistem ini diperuntukkan secara khusus bagi pengurus KPSPAMS dan Pemerintah Desa Kuajang yang terdaftar resmi.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-2">
                <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Kebijakan Keamanan Akun Dinas:</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Setiap pengurus memiliki kredensial resmi berdasarkan SK Pemerintah Desa. Dilarang membagikan atau memindahtangankan kata sandi dinas kepada pihak yang tidak berwenang.
                </p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Jika Anda lupa kata sandi atau belum memiliki akun dinas resmi, silakan hubungi <strong>Administrator TI Desa Kuajang</strong> di Kantor Desa Kuajang untuk verifikasi identitas dan penerbitan akses baru.
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
