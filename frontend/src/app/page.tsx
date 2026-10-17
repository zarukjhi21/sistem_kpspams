"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import {
  ShieldCheck,
  Activity,
  Users,
  FileText,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle,
  CheckCircle2,
  Receipt,
  Wallet,
  Search,
  Droplets,
  Mountain,
  PhoneCall,
  HelpCircle,
  Lock,
  ArrowDown,
  Layers,
  MapPin,
  TrendingUp,
  Gauge,
  Maximize2,
  X,
  Menu,
  Wrench,
  Clock,
  BookOpen,
  Info,
  Send,
  MessageSquare,
  AlertTriangle,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { AnimatedCount, ScrollReveal } from "@/components/ui/ScrollAnimations";

const PublicTransparencyCharts = dynamic(
  () => import("@/components/charts/PublicTransparencyCharts").then((m) => m.PublicTransparencyCharts),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full animate-pulse bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Memuat visualisasi keuangan transparansi...</span>
        </div>
      </div>
    ),
  }
);

const PublicGisMapSection = dynamic(
  () => import("@/components/gis/PublicGisMapSection").then((m) => m.PublicGisMapSection),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 w-full animate-pulse bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Memuat peta satelit GIS sambungan air...</span>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);

  // Modals for Layanan Utama
  const [activeModal, setActiveModal] = useState<"complaint" | "registration" | "education" | null>(null);

  // Registration Form State
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDusun, setRegDusun] = useState("Lemo Baru");
  const [regAddress, setRegAddress] = useState("");

  // Complaint Form State
  const [compName, setCompName] = useState("");
  const [compPhone, setCompPhone] = useState("");
  const [compDusun, setCompDusun] = useState("Lemo Baru");
  const [compText, setCompText] = useState("");

  const [stats, setStats] = useState({
    lmbCash: 31616000,
    lmbCustomers: 202,
    lmbActiveConnections: 202,
    lmbSealedConnections: 0,
    lmbUsageM3: 0,
    lmbPhysicalMeterM3: 322684.49,
    totalCash: 31616000,
    totalCustomers: 202,
    totalUsageM3: 0,
    totalPhysicalMeterM3: 322684.49,
    billingPeriod: "Oktober 2026",
    totalCollected: 1850000,
    paidCount: 185,
    totalArrears: 170000,
    unpaidCount: 17,
    totalInvoices: 202,
    collectionRate: 91.6,
  });

  useEffect(() => {
    // 1. Ambil data KPI real-time dasbor utama
    apiClient<any>("/dashboard/overview")
      .then((res) => {
        if (res?.status === "success" && res.data?.kpi) {
          const k = res.data.kpi;
          const collected = Number(k.total_collected) || 1850000;
          const arrears = Number(k.total_arrears) || 170000;
          setStats((prev) => ({
            ...prev,
            lmbCash: Number(k.total_cash_balance) || prev.lmbCash,
            lmbCustomers: Number(k.total_customers) || prev.lmbCustomers,
            lmbActiveConnections: Number(k.active_connections) || Number(k.total_customers) || 202,
            lmbSealedConnections: Number(k.sealed_connections) || 0,
            lmbUsageM3: Number(k.total_usage_m3) || 0,
            lmbPhysicalMeterM3: Number(k.total_physical_meter_m3) || prev.lmbPhysicalMeterM3,
            totalCash: Number(k.total_cash_balance) || prev.totalCash,
            totalCustomers: Number(k.total_customers) || prev.totalCustomers,
            totalUsageM3: Number(k.total_usage_m3) || 0,
            totalPhysicalMeterM3: Number(k.total_physical_meter_m3) || prev.totalPhysicalMeterM3,
            totalCollected: collected,
            paidCount: Math.round(collected / 10000),
            totalArrears: arrears,
            unpaidCount: Math.round(arrears / 10000),
            totalInvoices: Number(k.total_customers) || 202,
            collectionRate: Number(k.collection_rate_percent) || 91.6,
          }));
        }
      })
      .catch((err) => {
        console.warn("HomePage: could not fetch live overview stats", err);
      });
  }, []);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    router.push(`/portal?no=${encodeURIComponent(quickSearch.trim())}`);
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const focusSearchInput = () => {
    const el = document.getElementById("cek-tagihan");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 500);
    }
  };

  // WhatsApp Actions
  const handleSendWhatsAppRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Halo Admin KPSPAMS Desa Kuajang,%0A%0ASaya ingin mengajukan *Pemasangan Sambungan Rumah (SR) Baru*:%0A- Nama: ${encodeURIComponent(regName)}%0A- No. HP: ${encodeURIComponent(regPhone)}%0A- Dusun: ${encodeURIComponent(regDusun)}%0A- Alamat: ${encodeURIComponent(regAddress)}%0A%0AMohon informasi syarat & jadwal survei teknis pipa. Terima kasih.`;
    window.open(`https://wa.me/6282348507873?text=${text}`, "_blank");
    setActiveModal(null);
  };

  const handleSendWhatsAppComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Halo Tim Siaga KPSPAMS Desa Kuajang,%0A%0ASaya ingin menyampaikan *Laporan Kendala / Pengaduan*:%0A- Nama: ${encodeURIComponent(compName)}%0A- No. HP: ${encodeURIComponent(compPhone)}%0A- Dusun: ${encodeURIComponent(compDusun)}%0A- Kendala: ${encodeURIComponent(compText)}%0A%0AMohon bantuan pengecekan pipa/meteran. Terima kasih.`;
    window.open(`https://wa.me/6282348507873?text=${text}`, "_blank");
    setActiveModal(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col selection:bg-sky-500 selection:text-white font-sans overflow-x-hidden">
      {/* 1. Navbar / Header Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-shrink-0 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-sky-600 to-cyan-500 p-0.5 shadow-md shadow-sky-500/20 flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1 overflow-hidden">
                <Image
                  src="/logo.jpg"
                  alt="Logo KPSPAMS Kuajang"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-lg"
                  priority
                />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-sky-600 transition">
                  KPSPAMS
                </span>
                <span className="text-base sm:text-lg font-black tracking-tight text-sky-600">
                  KUAJANG
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate hidden xs:block">
                Desa Kuajang, Kec. Binuang, Polman
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-xs sm:text-sm font-bold text-slate-600">
            <button
              onClick={() => scrollToSection("beranda")}
              className="px-3 py-2 text-sky-600 font-extrabold relative group transition"
            >
              <span>Beranda</span>
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-sky-600 rounded-full" />
            </button>
            <button
              onClick={() => scrollToSection("tentang-kami")}
              className="px-3 py-2 hover:text-sky-600 transition rounded-lg hover:bg-slate-50"
            >
              Tentang Kami
            </button>
            <button
              onClick={() => scrollToSection("layanan")}
              className="px-3 py-2 hover:text-sky-600 transition rounded-lg hover:bg-slate-50"
            >
              Layanan
            </button>
            <button
              onClick={focusSearchInput}
              className="px-3 py-2 hover:text-sky-600 transition rounded-lg hover:bg-slate-50"
            >
              Cek Tagihan
            </button>
            <button
              onClick={() => scrollToSection("informasi")}
              className="px-3 py-2 hover:text-sky-600 transition rounded-lg hover:bg-slate-50"
            >
              Informasi
            </button>
            <button
              onClick={() => scrollToSection("kontak")}
              className="px-3 py-2 hover:text-sky-600 transition rounded-lg hover:bg-slate-50"
            >
              Kontak
            </button>
          </nav>

          {/* Right Action: Login Pengelola & Mobile Hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              href="/login"
              className="px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl border-2 border-sky-600 text-sky-700 hover:bg-sky-600 hover:text-white text-xs sm:text-sm font-extrabold transition duration-200 active:scale-95 shadow-xs flex items-center space-x-1.5 whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login<span className="hidden sm:inline"> Pengelola</span></span>
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition active:scale-95"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/98 px-4 pt-3 pb-5 space-y-2 shadow-xl animate-in slide-in-from-top-2">
            <button
              onClick={() => scrollToSection("beranda")}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-sky-600 bg-sky-50 flex items-center justify-between"
            >
              <span>Beranda</span>
              <ChevronRight className="w-4 h-4 text-sky-500" />
            </button>
            <button
              onClick={() => scrollToSection("tentang-kami")}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Tentang Kami</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => scrollToSection("layanan")}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Layanan Utama</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={focusSearchInput}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Cek Tagihan Warga</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => scrollToSection("informasi")}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>KPSPAMS Dalam Angka</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => scrollToSection("peta-gis")}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Peta Satelit GIS &amp; Transparansi</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => scrollToSection("kontak")}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Kontak &amp; Pengaduan</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main id="beranda" className="flex-1 w-full space-y-12 sm:space-y-16 lg:space-y-20">
        {/* 2. Hero Section: Clean, Modern White & Sky Blue Theme */}
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-slate-50/50 to-[#F8FAFC] pt-6 sm:pt-10 lg:pt-14 pb-10 sm:pb-12 lg:pb-14 border-b border-slate-200/60">
          {/* Subtle Background Pattern Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-teal-200/40 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Heading, Subtitle & Buttons */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-center lg:text-left">
                {/* Hero Title */}
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-snug sm:leading-[1.15]">
                  Mewujudkan Akses Air Bersih &amp; Sanitasi untuk <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-teal-600">Desa Kuajang</span>
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 px-1 sm:px-0">
                  Sistem Informasi Kelompok Pengelola Sarana Prasarana Air Minum dan Sanitasi Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                  <button
                    onClick={focusSearchInput}
                    className="w-full sm:w-auto px-6 py-3 sm:py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-sky-600/30 transition active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Cek Tagihan Saya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollToSection("layanan")}
                    className="w-full sm:w-auto px-6 py-3 sm:py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs sm:text-sm border border-slate-300 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    Pelajari Selengkapnya
                  </button>
                </div>
              </div>

              {/* Right Column: High Quality 3D Isometric Illustration (Smart Floating Island + Live Badges) */}
              <div className="lg:col-span-6 flex justify-center items-center relative py-4 sm:py-6 lg:py-0">
                <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none flex items-center justify-center">
                  {/* Atmospheric Depth Glow & Pulsing Shadow Under Island */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/25 via-teal-300/20 to-sky-200/10 rounded-full blur-3xl transform pointer-events-none animate-island-shadow" />
                  
                  {/* Floating 3D Island */}
                  <div className="relative flex items-center justify-center animate-float-island">
                    <Image
                      src="/hero-water-illustration.png"
                      alt="Ilustrasi Infrastruktur Air Bersih KPSPAMS Desa Kuajang"
                      width={1024}
                      height={764}
                      priority
                      className="w-full h-auto max-h-[280px] sm:max-h-[420px] lg:max-h-none object-contain mx-auto drop-shadow-2xl transition-transform duration-500 hover:scale-[1.03]"
                    />
                  </div>

                  {/* Floating Live Badge 1: Flow Rate (Near Phone / IoT) */}
                  <div className="absolute -top-1 left-1 sm:top-1 sm:-left-2 lg:-top-1 lg:-left-4 z-20 animate-badge-1 pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md shadow-sky-950/5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 flex items-center space-x-2 transition hover:scale-105 select-none">
                      <div className="w-5 h-5 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                        <Droplets className="w-3 h-3 text-sky-600 animate-pulse" />
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-bold text-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span className="text-slate-500 font-semibold">Debit:</span>
                        <span>3.2 L/dtk</span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Lancar</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Live Badge 2: Reservoir Status (Top Right / Near Tanks) */}
                  <div className="absolute top-2 right-1 sm:top-4 sm:-right-2 lg:top-3 lg:-right-4 z-20 animate-badge-2 pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md shadow-sky-950/5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 flex items-center space-x-2 transition hover:scale-105 select-none">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Gauge className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-bold text-slate-800">
                        <span className="text-slate-500 font-semibold">Reservoir:</span>
                        <span>92%</span>
                        <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">Optimal</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Live Badge 3: Solar & Green Eco (Bottom Left / Near Solar Panel) */}
                  <div className="hidden sm:flex absolute bottom-2 left-2 sm:bottom-4 sm:left-4 lg:bottom-3 lg:left-0 z-20 animate-badge-3 pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md shadow-sky-950/5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 items-center space-x-2 transition hover:scale-105 select-none">
                      <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-3 h-3 text-amber-500" />
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-bold text-slate-800">
                        <span className="text-slate-500 font-semibold">Solar Power:</span>
                        <span>100% Mandiri</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Floating Card: "Cek Tagihan Meteran Air Anda" (Sleek Minimalist Figma Match) */}
        <section id="cek-tagihan" className="max-w-2xl mx-auto px-4 !-mt-10 sm:!-mt-14 lg:!-mt-16 relative z-30">
          <ScrollReveal direction="up" distance={20}>
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-teal-500 via-sky-600 to-blue-600 p-4 sm:p-7 shadow-xl shadow-sky-950/20 text-white">
              <h2 className="text-sm sm:text-xl font-bold tracking-tight text-white text-center mb-2.5 sm:mb-4">
                Cek Tagihan Meteran Air Anda
              </h2>

              {/* Clean Unified Search Bar with Zero Clutter & No Harsh Borders */}
              <form
                onSubmit={handleQuickSearch}
                className="bg-white rounded-xl sm:rounded-2xl p-1.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Masukkan Nomor ID Pelanggan (Contoh: PL-001)"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-medium border-0 focus:ring-0 focus:outline-none bg-transparent"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-lg sm:rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs sm:text-sm transition active:scale-95 whitespace-nowrap shadow-xs cursor-pointer text-center"
                >
                  Periksa Tagihan
                </button>
              </form>
            </div>
          </ScrollReveal>
        </section>

        {/* 4. Section: "Layanan Utama" (4 Cards Grid) */}
        <section id="layanan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <ScrollReveal direction="up">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Layanan Utama
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {/* Card 1: Cek & Bayar Tagihan */}
            <ScrollReveal direction="up" delay={0}>
              <div
                onClick={() => router.push("/portal")}
                className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-sky-300 transition duration-300 flex flex-col items-center text-center cursor-pointer group h-full"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition duration-300 shadow-xs">
                  <Receipt className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-sky-600 transition">
                  Cek &amp; Bayar Tagihan
                </h3>
              </div>
            </ScrollReveal>

            {/* Card 2: Pengaduan & Aspirasi */}
            <ScrollReveal direction="up" delay={80}>
              <div
                onClick={() => setActiveModal("complaint")}
                className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition duration-300 flex flex-col items-center text-center cursor-pointer group h-full"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition duration-300 shadow-xs">
                  <Wrench className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-teal-600 transition">
                  Pengaduan &amp; Aspirasi
                </h3>
              </div>
            </ScrollReveal>

            {/* Card 3: Pengajuan Pasang Baru */}
            <ScrollReveal direction="up" delay={160}>
              <div
                onClick={() => setActiveModal("registration")}
                className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition duration-300 flex flex-col items-center text-center cursor-pointer group h-full"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition duration-300 shadow-xs">
                  <Droplets className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-blue-600 transition">
                  Pengajuan Pasang Baru
                </h3>
              </div>
            </ScrollReveal>

            {/* Card 4: Informasi & Edukasi */}
            <ScrollReveal direction="up" delay={240}>
              <div
                onClick={() => setActiveModal("education")}
                className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition duration-300 flex flex-col items-center text-center cursor-pointer group h-full"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition duration-300 shadow-xs">
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-indigo-600 transition">
                  Informasi &amp; Edukasi
                </h3>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 5. Section: "Status Operasional & Transparansi Real-Time" (6 KPI Cards - Sesuai Permintaan User) */}
        <section id="informasi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <ScrollReveal direction="up">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Status Operasional &amp; Transparansi Kas
                </h2>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto flex items-center space-x-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />
                <span>Sinkron Database Realtime</span>
              </span>
            </div>
          </ScrollReveal>

          {/* 6 Real-Time Metric Cards (Grid 3 Kolom Sesuai Dasbor & Foto User) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
            {/* Kartu 1: Pelanggan Aktif */}
            <ScrollReveal direction="up" delay={0}>
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:shadow-md transition h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    PELANGGAN AKTIF
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-tabular">
                    <AnimatedCount value={stats.lmbCustomers} duration={1400} /> <span className="text-xs font-normal text-slate-400">SR</span>
                  </span>
                  <span className="text-xs text-emerald-600 font-bold flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                    Aktif
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {stats.lmbActiveConnections || stats.lmbCustomers} SR aktif • {stats.lmbSealedConnections || 0} tersegel
                </p>
              </div>
            </ScrollReveal>

            {/* Kartu 2: Pakai Bulan Ini */}
            <ScrollReveal direction="up" delay={70}>
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:shadow-md transition h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    PAKAI BULAN INI
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-tabular">
                    <AnimatedCount value={stats.lmbUsageM3} duration={1400} /><span className="text-xs font-normal text-slate-400 ml-0.5">m³</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    BULAN INI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {stats.lmbUsageM3 === 0
                    ? "Beban dasar Rp 10.000/SR"
                    : `Rata-rata ${(stats.lmbCustomers > 0 ? (stats.lmbUsageM3 / stats.lmbCustomers).toFixed(1) : 0)} m³/SR`}
                </p>
              </div>
            </ScrollReveal>

            {/* Kartu 3: Stand Fisik Meteran */}
            <ScrollReveal direction="up" delay={140}>
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:shadow-md transition h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    STAND FISIK METERAN
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Gauge className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-tabular truncate">
                    <AnimatedCount value={stats.lmbPhysicalMeterM3} decimals={2} duration={1800} /><span className="text-xs font-normal text-slate-400 ml-0.5">m³</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    ODOMETER
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  Total putaran meter {stats.lmbCustomers} SR
                </p>
              </div>
            </ScrollReveal>

            {/* Kartu 4: Penerimaan Iuran */}
            <ScrollReveal direction="up" delay={210}>
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:shadow-md transition h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    PENERIMAAN IURAN
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 font-tabular truncate">
                    <AnimatedCount value={stats.totalCollected} prefix="Rp " duration={1600} />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    <AnimatedCount value={stats.collectionRate} decimals={1} suffix="%" duration={1600} />
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {stats.paidCount} SR terbayar lunas
                </p>
              </div>
            </ScrollReveal>

            {/* Kartu 5: Tunggakan Berjalan */}
            <ScrollReveal direction="up" delay={280}>
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:shadow-md transition h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    TUNGGAKAN BERJALAN
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl sm:text-2xl font-black text-rose-700 font-tabular truncate">
                    <AnimatedCount value={stats.totalArrears} prefix="Rp " duration={1600} />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                    BELUM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {stats.unpaidCount} SR belum terbayar
                </p>
              </div>
            </ScrollReveal>

            {/* Kartu 6: Saldo Kas Unit */}
            <ScrollReveal direction="up" delay={350}>
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:shadow-md transition h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    SALDO KAS UNIT
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-tabular truncate">
                    <AnimatedCount value={stats.totalCash} prefix="Rp " duration={1800} />
                  </span>
                </div>
                <p className="text-[11px] text-emerald-600 font-medium truncate mt-0.5">
                  Awal Rp 29.766k + Masuk Rp {Math.round(stats.totalCollected / 1000)}k
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 6. Section: "Tentang Kami & 3 Unit Pengelola KPSPAMS Desa Kuajang" */}
        <section id="tentang-kami" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <ScrollReveal direction="up">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                3 Unit Pengelola KPSPAMS Desa Kuajang
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Unit 1: KPSPAMS Lemo Baru */}
            <ScrollReveal direction="up" delay={0}>
              <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-emerald-500 shadow-md flex flex-col justify-between space-y-4 h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      Unit 1 (LMB)
                    </span>
                    <span className="text-xs text-emerald-700 font-extrabold flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Aktif Beroperasi</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      KPSPAMS Lemo Baru
                    </h3>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      Wilayah: Dusun Lemo Baru
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Sistem Mata Air Pegunungan (100% Gravitasi Alami tanpa pompa listrik).
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Pelanggan Terlayani:</span>
                      <strong className="text-slate-900 font-extrabold">{stats.lmbCustomers} Sambungan (SR)</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Kas Operasional Riil:</span>
                      <strong className="text-emerald-700 font-extrabold">Rp {stats.lmbCash.toLocaleString("id-ID")}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Stand Fisik:</span>
                      <strong className="text-slate-900 font-extrabold">
                        {stats.lmbPhysicalMeterM3.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m³
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => scrollToSection("peta-gis")}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Lihat Sebaran Pipa di Peta GIS</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </ScrollReveal>

            {/* Unit 2: KPSPAMS Lemo Tua */}
            <ScrollReveal direction="up" delay={120}>
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs opacity-90 flex flex-col justify-between space-y-4 h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      Unit 2 (LMT)
                    </span>
                    <span className="text-xs text-amber-600 font-bold flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Tahap Persiapan</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      KPSPAMS Lemo Tua
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Wilayah: Dusun Lemo Tua
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Sumur Bor &amp; Sumber Air Baku Siaga.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Pelanggan Terdaftar:</span>
                      <strong className="text-slate-700 font-bold">Tahap Pendaftaran</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Status Jaringan:</span>
                      <strong className="text-slate-700 font-bold">Penyusunan Pipa</strong>
                    </div>
                  </div>
                </div>

                <div className="py-2.5 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 font-medium">
                  Penyusunan Jaringan Air Bersih
                </div>
              </div>
            </ScrollReveal>

            {/* Unit 3: KPSPAMS Sarampu 1 & Pakkandoang */}
            <ScrollReveal direction="up" delay={240}>
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs opacity-90 flex flex-col justify-between space-y-4 h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      Unit 3 (SRP)
                    </span>
                    <span className="text-xs text-cyan-700 font-bold flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span>Tahap Persiapan</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      KPSPAMS Sarampu 1
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Wilayah: Dusun Sarampu 1 &amp; Pakkandoang
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Jaringan Pipa &amp; Bak Penampung Transmisi.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Pelanggan Terdaftar:</span>
                      <strong className="text-slate-700 font-bold">Tahap Pendaftaran</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Status Jaringan:</span>
                      <strong className="text-slate-700 font-bold">Penyusunan Pipa</strong>
                    </div>
                  </div>
                </div>

                <div className="py-2.5 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 font-medium">
                  Penyusunan Jaringan Air Bersih
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 7. Section: Peta Satelit GIS Interaktif */}
        <section id="peta-gis" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <ScrollReveal direction="up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Peta Satelit GIS Sambungan Air Warga
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 hidden sm:inline-block">
                Satelit Resolusi Tinggi
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md p-2 sm:p-4 overflow-hidden">
              <PublicGisMapSection />
            </div>
          </ScrollReveal>
        </section>

        {/* 8. Section: Transparansi Keuangan Realtime */}
        <section id="transparansi-kas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <ScrollReveal direction="up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Transparansi Kas &amp; Iuran Warga Real-Time
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 hidden sm:inline-block">
                Audit Akuntabel
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md p-3 sm:p-6 overflow-hidden">
              <PublicTransparencyCharts />
            </div>
          </ScrollReveal>
        </section>

        {/* 9. Section: Kontak & Pusat Layanan Siaga */}
        <section id="kontak" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <ScrollReveal direction="up" delay={80}>
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 lg:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  Butuh Bantuan atau Ada Gangguan Aliran Air?
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
                <button
                  onClick={() => setActiveModal("complaint")}
                  className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Kirim Laporan Gangguan</span>
                </button>
                <a
                  href="https://wa.me/6282348507873?text=Halo%20Pengurus%20KPSPAMS%20Desa%20Kuajang,%20saya%20warga%20ingin%20bertanya..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center space-x-2 whitespace-nowrap"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Pengurus</span>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* 10. Section: Struktur Organisasi Pengurus (Tepat di Atas Footer) */}
        <section id="struktur-organisasi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 space-y-4">
          <ScrollReveal direction="up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Struktur Pengurus KPSPAMS Desa Kuajang
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsStructureModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-sky-500 text-slate-700 hover:text-sky-700 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Perbesar</span>
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md p-3 sm:p-6 overflow-hidden flex flex-col items-center justify-center">
              <div
                onClick={() => setIsStructureModalOpen(true)}
                className="relative w-full max-w-4xl mx-auto cursor-pointer group transition duration-300 hover:shadow-xl rounded-2xl overflow-hidden border border-slate-100 bg-slate-950 flex items-center justify-center"
                title="Klik untuk memperbesar gambar struktur"
              >
                <Image
                  src="/struktur-organisasi-lemobaru.jpg"
                  alt="Struktur Organisasi KPSPAMS Lemo Baru Desa Kuajang"
                  width={1024}
                  height={764}
                  className="w-full h-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                />
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow opacity-90 group-hover:opacity-100 transition">
                  <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Klik untuk Memperbesar</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* 11. Footer Section */}
      <footer className="bg-white text-slate-600 text-xs py-8 border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className="font-black text-slate-900 text-sm">KPSPAMS KUAJANG</span>
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">v2.0</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                © 2026 Pemerintah Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar, Sulawesi Barat.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 text-[11px] font-semibold">
              <button onClick={() => scrollToSection("struktur-organisasi")} className="hover:text-sky-600 transition">
                Struktur Pengurus
              </button>
              <span>•</span>
              <Link href="/portal" className="hover:text-sky-600 transition">
                Portal Warga Mandiri
              </Link>
              <span>•</span>
              <Link href="/login" className="hover:text-sky-600 transition font-bold text-sky-700">
                Login Pengelola
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <p className="text-center sm:text-left">
              Dirancang &amp; Dikembangkan oleh <span className="text-sky-600 font-bold">Pua Kaso</span> untuk Kemandirian Layanan Air Bersih Desa Kuajang.
            </p>
            <span className="text-slate-400 text-[10px]">Kecamatan Binuang, Polewali Mandar</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Pengaduan & Aspirasi Warga */}
      {activeModal === "complaint" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Form Pengaduan &amp; Aspirasi</h3>
                  <p className="text-[11px] text-slate-500">Tim Siaga Reaksi Cepat KPSPAMS Kuajang</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendWhatsAppComplaint} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Lengkap Pelapor:</label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="Contoh: Bpk. Arman"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nomor WhatsApp / HP:</label>
                  <input
                    type="tel"
                    required
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Wilayah Dusun:</label>
                  <select
                    value={compDusun}
                    onChange={(e) => setCompDusun(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="Lemo Baru">Lemo Baru</option>
                    <option value="Lemo Tua">Lemo Tua</option>
                    <option value="Sarampu 1">Sarampu 1</option>
                    <option value="Pakkandoang">Pakkandoang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Keterangan Kendala / Lokasi:</label>
                <textarea
                  required
                  rows={3}
                  value={compText}
                  onChange={(e) => setCompText(e.target.value)}
                  placeholder="Contoh: Pipa dekat pos ronda bocor air meluber ke jalan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Laporan ke WhatsApp Petugas</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Pengajuan Pasang Baru */}
      {activeModal === "registration" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Pengajuan Sambungan Baru (SR)</h3>
                  <p className="text-[11px] text-slate-500">Pemasangan meteran air bersih Desa Kuajang</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendWhatsAppRegistration} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Kepala Keluarga (KK):</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nama sesuai KTP"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Pilihan Dusun:</label>
                  <select
                    value={regDusun}
                    onChange={(e) => setRegDusun(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Lemo Baru">Lemo Baru</option>
                    <option value="Lemo Tua">Lemo Tua</option>
                    <option value="Sarampu 1">Sarampu 1</option>
                    <option value="Pakkandoang">Pakkandoang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Alamat Rumah Lengkap / RT:</label>
                <textarea
                  required
                  rows={2}
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Contoh: RT 02 Dusun Lemo Baru (Dekat Lapangan Bola)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
                ℹ️ <strong>Syarat Pemasangan Baru:</strong> Fotokopi KTP/KK pemohon &amp; bersedia dilakukan survei teknis jalur pipa oleh petugas lapangan.
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Formulir Permohonan ke Admin</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Informasi & Edukasi Tarif Air */}
      {activeModal === "education" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Informasi Tarif &amp; Edukasi</h3>
                  <p className="text-[11px] text-slate-500">Ketentuan Resmi KPSPAMS Desa Kuajang</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {/* Box Tarif Air */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  <span>Struktur Tarif Iuran Air Bersih:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 pl-4 list-disc">
                  <li>
                    <strong>Tarif Dasar Bulanan:</strong> <code>Rp 10.000 / bulan</code> (Pemakaian s.d. <strong>35 m³</strong>).
                  </li>
                  <li>
                    <strong>Kelebihan Pemakaian (Progresif):</strong> Di atas 35 m³, dihitung <code>Rp 1.000 / m³</code>.
                    <p className="text-[10px] text-slate-500 italic mt-0.5">
                      Contoh: Pemakaian 36 m³ = Beban Dasar Rp 10.000 + (1 m³ x Rp 1.000) = Rp 11.000.
                    </p>
                  </li>
                  <li>
                    <strong>Khusus Unit Lemo Baru:</strong> Menggunakan sistem mata air gravitasi alami tanpa beban pompa listrik PLN.
                  </li>
                </ul>
              </div>

              {/* Box Jadwal Pembayaran */}
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1.5 text-xs text-sky-950">
                <div className="font-bold text-sky-900">📅 Periode Pembayaran &amp; Catat Meter:</div>
                <p>Pencatatan meteran dilakukan oleh petugas setiap tanggal 1-5 awal bulan. Pembayaran iuran dapat dilakukan langsung kepada petugas lapangan atau melalui bendahara desa.</p>
              </div>

              {/* Tips Hemat Air */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-xs text-emerald-950">
                <div className="font-bold text-emerald-900">💡 Tips Pelanggan:</div>
                <p>Periksa selalu kran penampung agar tidak meluber, dan laporkan segera jika ada indikasi kebocoran pipa bawah tanah untuk menjaga kelancaran debit aliran air warga lainnya.</p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
            >
              Tutup Informasi
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal: Struktur Organisasi Fullscreen */}
      {isStructureModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsStructureModalOpen(false)}
        >
          <div 
            className="relative max-w-5xl w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-3 sm:p-5 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 px-1">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span className="text-xs sm:text-sm font-black text-slate-900">Struktur Pengurus KPSPAMS Lemo Baru Desa Kuajang</span>
              </div>
              <button
                type="button"
                onClick={() => setIsStructureModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center rounded-xl bg-slate-50 p-1 sm:p-2 border border-slate-100">
              <Image
                src="/struktur-organisasi-lemobaru.jpg"
                alt="Struktur Organisasi KPSPAMS Lemo Baru"
                width={1400}
                height={1000}
                className="w-auto h-auto max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
