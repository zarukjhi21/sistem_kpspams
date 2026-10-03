import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center items-center px-4 sm:px-6 py-12 text-slate-800 selection:bg-brand-maroon-800 selection:text-white">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Brand Icon */}
        <div className="inline-flex justify-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-gold-500/50 shadow-xl shadow-brand-maroon-950/20 bg-slate-950 flex items-center justify-center">
            <Image
              src="/logo.jpg"
              alt="Logo SI-KPSPAMS Kuajang"
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Status Code & Headings */}
        <div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-brand-maroon-50 text-brand-maroon-800 border border-brand-maroon-200 mb-2">
            Error 404 • Halaman Tidak Ditemukan
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Alamat Halaman Tidak Tersedia
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Halaman atau tautan yang Anda tuju mungkin telah dipindahkan, dihapus, atau belum terdaftar dalam sistem SI-KPSPAMS Desa Kuajang.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-maroon-800 to-brand-maroon-900 hover:from-brand-maroon-900 hover:to-black text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-maroon-950/20 transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <Link
            href="/portal"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-300 shadow-sm transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Portal Warga</span>
          </Link>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-200/80 text-[11px] text-slate-400">
          SI-KPSPAMS Desa Kuajang • Kec. Binuang, Kab. Polewali Mandar
        </div>
      </div>
    </div>
  );
}
