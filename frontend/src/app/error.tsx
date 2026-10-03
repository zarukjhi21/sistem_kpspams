"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception for audit / client analytics
    console.error("SI-KPSPAMS Frontend Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center items-center px-4 sm:px-6 py-12 text-slate-800 selection:bg-brand-maroon-800 selection:text-white">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="inline-flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-rose-200 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/10">
            <AlertTriangle className="w-9 h-9 stroke-[2.2]" />
          </div>
        </div>

        {/* Headings */}
        <div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 mb-2">
            Terjadi Kesalahan Aplikasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gagal Memuat Halaman
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Terjadi kendala sementara pada sistem atau koneksi perangkat Anda. Silakan coba muat ulang atau kembali ke halaman beranda.
          </p>
          {error?.digest && (
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Kode Referensi: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-maroon-800 to-brand-maroon-900 hover:from-brand-maroon-900 hover:to-black text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-maroon-950/20 transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Coba Muat Ulang</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-300 shadow-sm transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-200/80 text-[11px] text-slate-400">
          SI-KPSPAMS Desa Kuajang • Bantuan Teknis TI Desa
        </div>
      </div>
    </div>
  );
}
