"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Droplet,
  AlertCircle,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Send,
  MapPin,
  Phone,
  Sparkles,
  X,
  Search,
  Loader2,
  Printer,
  Clock,
  Wrench,
  Check,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getApiBaseUrl } from "@/lib/api-client";

interface CustomerData {
  id: number;
  full_name: string;
  nik_masked: string;
  phone?: string;
  tariff_type: string;
  address?: string;
  dusun: string;
  village?: string;
  district?: string;
}

interface ConnectionData {
  id: number;
  connection_no: string;
  meter_serial: string;
  meter_brand: string;
  meter_diameter?: string;
  meter_initial?: number;
  status: string;
  kpspams_id: number;
  kpspams_name: string;
  kpspams_phone?: string;
  kpspams_bank?: string;
  kpspams_address?: string;
}

interface CurrentBillData {
  invoice_id: number;
  invoice_number: string;
  receipt_number?: string;
  period_name: string;
  usage_m3: number;
  water_amount: number;
  admin_fee: number;
  maintenance_fee: number;
  penalty_fee: number;
  total_amount: number;
  paid_amount?: number;
  balance_due: number;
  status: "PAID" | "UNPAID" | string;
  due_date: string;
  paid_at?: string | null;
  payment_method?: string;
  reference_number?: string | null;
  payment_notes?: string;
  is_paid: boolean;
}

interface ConsumptionHistoryItem {
  period_id?: number;
  period_name: string;
  month: string;
  reading_date?: string | null;
  previous_reading: number;
  current_reading: number;
  usage_m3: number;
  has_reading?: boolean;
}

interface RecentComplaint {
  id: number;
  ticket_number: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at?: string | null;
}

interface MultipleMatchItem {
  id: number;
  connection_id: number;
  connection_no: string;
  full_name: string;
  nik_masked: string;
  dusun: string;
  tariff_name: string;
  kpspams_name: string;
}

interface PortalSearchResult {
  customer: CustomerData;
  connection: ConnectionData;
  current_bill: CurrentBillData | null;
  consumption_history: ConsumptionHistoryItem[];
  recent_complaints?: RecentComplaint[];
}

function CitizenPortalContent() {
  const searchParams = useSearchParams();
  const [searchSr, setSearchSr] = useState("");
  const [data, setData] = useState<PortalSearchResult | null>(null);
  const [multipleMatches, setMultipleMatches] = useState<MultipleMatchItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Complaint modal states
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState("AIR_MATI");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [ticketGenerated, setTicketGenerated] = useState<string | null>(null);
  const [complaintError, setComplaintError] = useState<string | null>(null);

  // Invoice & Receipt modal states
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Auto-search if ?sr= or ?nik= parameter is provided in URL
  useEffect(() => {
    const qParam = searchParams.get("sr") || searchParams.get("nik") || searchParams.get("q");
    if (qParam) {
      setSearchSr(qParam);
      fetchRealCustomerData(qParam);
    }
  }, [searchParams]);

  const fetchRealCustomerData = async (query: string, exactId?: number) => {
    const cleanQuery = query.trim();
    if (!cleanQuery && !exactId) {
      setErrorMessage("Silakan masukkan Nomor Sambungan (No. SR), NIK, atau Nama Anda.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setMultipleMatches(null);

    try {
      const baseUrl = getApiBaseUrl();
      const url = exactId
        ? `${baseUrl}/portal/check-sr?id=${exactId}`
        : `${baseUrl}/portal/check-sr?q=${encodeURIComponent(cleanQuery)}`;

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      const json = await res.json();

      if (res.ok && json.status === "success" && json.data?.customer) {
        setData(json.data);
        setMultipleMatches(null);
        setErrorMessage(null);
      } else if (json.status === "multiple_matches" && json.data?.matches) {
        setData(null);
        setMultipleMatches(json.data.matches);
        setErrorMessage(null);
      } else {
        setData(null);
        setMultipleMatches(null);
        setErrorMessage(
          json.message ||
            `Data dengan kata kunci '${cleanQuery}' tidak ditemukan dalam basis data resmi Desa Kuajang.`
        );
      }
    } catch {
      setData(null);
      setMultipleMatches(null);
      setErrorMessage(
        "Gagal terhubung ke server SI-KPSPAMS. Pastikan koneksi internet aktif dan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRealCustomerData(searchSr);
  };

  const handleResetSearch = () => {
    setData(null);
    setMultipleMatches(null);
    setSearchSr("");
    setErrorMessage(null);
  };

  const handleSelectCustomer = (match: MultipleMatchItem) => {
    fetchRealCustomerData("", match.id);
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setIsSubmittingComplaint(true);
    setComplaintError(null);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/portal/complaint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          customer_id: data.customer.id,
          connection_id: data.connection.id,
          kpspams_id: data.connection.kpspams_id,
          connection_no: data.connection.connection_no,
          category: complaintCategory,
          description: complaintDesc,
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.status === "success") {
        setTicketGenerated(resJson.data?.ticket_number || "TKT/PROSES");
        setComplaintDesc("");
        // Refresh customer data to include the new ticket
        fetchRealCustomerData("", data.customer.id);
      } else {
        setComplaintError(resJson.message || "Gagal mengirim pengaduan. Silakan periksa formulir.");
      }
    } catch {
      setComplaintError("Terjadi kesalahan jaringan saat mengirim laporan pengaduan.");
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Helper format phone for WhatsApp
  const getWhatsAppLink = (isPaid: boolean) => {
    if (!data) return "#";
    const rawPhone = data.connection.kpspams_phone || "082199887766";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const waPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;

    let message = "";
    if (isPaid) {
      message = `Halo Pengurus ${data.connection.kpspams_name}, saya warga ${data.customer.full_name} (No. SR: ${data.connection.connection_no}). Saya ingin menanyakan informasi layanan air bersih. Terima kasih.`;
    } else {
      message = `Halo Petugas ${data.connection.kpspams_name}, saya warga ${data.customer.full_name} (No. SR: ${data.connection.connection_no}) bermaksud mengonfirmasi pembayaran tagihan periode ${data.current_bill?.period_name || "berjalan"} sejumlah Rp ${data.current_bill?.total_amount.toLocaleString("id-ID") || "10.000"}. Mohon info jadwal kunjungan petugas ke rumah kami.`;
    }

    return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
  };

  // Helper format date
  const formatDateIndo = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper calculation for history max bar
  const maxUsage = data?.consumption_history?.length
    ? Math.max(...data.consumption_history.map((h) => h.usage_m3), 10)
    : 10;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand-maroon-800 selection:text-white">
      {/* Citizen Header Bar */}
      <header className="bg-slate-950/95 backdrop-blur-md text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link href="/portal" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-brand-gold-500/50 shadow bg-slate-950 flex-shrink-0 flex items-center justify-center p-0.5">
              <Image
                src="/logo.jpg"
                alt="Logo SI-KPSPAMS Kuajang"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs sm:text-sm font-black tracking-tight whitespace-nowrap">
                  PORTAL WARGA
                </span>
                <span className="hidden sm:inline-block text-[9px] sm:text-[10px] text-brand-gold-400 font-extrabold px-1.5 py-0.5 rounded bg-brand-gold-950/80 border border-brand-gold-500/40 whitespace-nowrap">
                  KUAJANG
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden sm:block">
                {data
                  ? `${data.connection.kpspams_name} • Dusun ${data.customer.dusun}`
                  : "Pelayanan Publik Air Bersih & Sanitasi"}
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <Link
              href="/"
              className="text-[11px] sm:text-xs text-slate-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition font-medium"
            >
              Beranda
            </Link>
            <Link
              href="/login"
              className="text-[11px] sm:text-xs text-brand-gold-300 hover:text-brand-gold-200 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-brand-gold-950/40 hover:bg-brand-gold-950/70 border border-brand-gold-500/30 transition font-bold whitespace-nowrap"
            >
              Login Petugas
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 w-full space-y-4 sm:space-y-6">
        {!data ? (
          /* ========================================================================= */
          /* STATE 1: SEARCH SCREEN (Form Pencarian Fleksibel: No SR, NIK, atau Nama)  */
          /* ========================================================================= */
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            {/* Hero Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-9 border border-slate-200/90 shadow-xl shadow-slate-200/50 relative overflow-hidden">
              <div className="w-full h-1.5 bg-gradient-to-r from-brand-maroon-800 via-brand-maroon-600 to-brand-gold-500 rounded-t-2xl sm:rounded-t-3xl absolute top-0 left-0 right-0" />

              <div className="max-w-xl mx-auto text-center pt-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-maroon-50 text-brand-maroon-800 border border-brand-maroon-200/80 mx-auto flex items-center justify-center mb-3 shadow-xs">
                  <Droplet className="w-6 h-6 sm:w-7 sm:h-7 text-brand-maroon-800" />
                </div>

                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-brand-gold-50 text-brand-gold-900 border border-brand-gold-300 mb-2.5 sm:mb-3">
                  <span>Layanan Mandiri Warga Desa Kuajang</span>
                </div>

                <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  Cek Rekening &amp; Tagihan Air Bersih
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Periksa nominal tagihan resmi, riwayat pemakaian kubikasi meteran, dan cetak bukti kwitansi lunas.
                </p>

                {/* Form Input Pencarian Fleksibel */}
                <form onSubmit={handleSearchSubmit} className="mt-5 sm:mt-7">
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-brand-maroon-800" />
                      </div>
                      <input
                        type="text"
                        required
                        disabled={isLoading}
                        value={searchSr}
                        onChange={(e) => {
                          setSearchSr(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Masukkan No. SR (cth: 00009), NIK KTP, atau Nama Warga..."
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 text-xs sm:text-base font-semibold bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-800 focus:border-brand-maroon-800 text-slate-900 transition font-mono tracking-wide shadow-inner disabled:opacity-50"
                      />
                    </div>

                    {/* Quick Example Chips */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                      <span className="font-semibold text-slate-400">Pencarian Cepat:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchSr("00009");
                          fetchRealCustomerData("00009");
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold border border-slate-200 transition"
                      >
                        SR: 00009
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchSr("Syaharuddin");
                          fetchRealCustomerData("Syaharuddin");
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold border border-slate-200 transition"
                      >
                        Nama: Syaharuddin
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchSr("Mustari");
                          fetchRealCustomerData("Mustari");
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold border border-slate-200 transition"
                      >
                        Nama: Mustari
                      </button>
                    </div>

                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-left flex items-start space-x-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-brand-maroon-800 hover:bg-brand-maroon-900 active:scale-[0.99] transition shadow-lg shadow-brand-maroon-950/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-brand-gold-400" />
                          <span>Mencari Data di Server...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 text-brand-gold-400" />
                          <span>Periksa Rekening Air Saya</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* List Hasil Jika Ditemukan Lebih dari 1 Sambungan (Multiple Matches) */}
            {multipleMatches && multipleMatches.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border-2 border-brand-maroon-800/30 shadow-lg space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <Sparkles className="w-4 h-4 text-brand-gold-600" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    Ditemukan {multipleMatches.length} Sambungan Sesuai Pencarian Anda:
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Pilih nama sambungan Anda untuk langsung membuka rincian tagihan air:
                </p>

                <div className="divide-y divide-slate-100">
                  {multipleMatches.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSelectCustomer(m)}
                      className="py-3 px-3 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-slate-900 group-hover:text-brand-maroon-900 transition">
                            {m.full_name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {m.tariff_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 space-x-2 font-mono">
                          <span>No. SR: <strong className="text-brand-maroon-800">{m.connection_no}</strong></span>
                          <span>•</span>
                          <span>NIK: {m.nik_masked}</span>
                          <span>•</span>
                          <span>Dusun {m.dusun}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs font-bold text-brand-maroon-800 group-hover:translate-x-1 transition">
                        <span>Pilih</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informational Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-700 text-xs">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-bold text-slate-900">Di Mana Melihat No. SR?</h4>
                <p className="text-slate-500 leading-relaxed">
                  Nomor SR tertera pada pelat barcode meteran air di rumah Anda atau tercetak pada struk pembayaran bulan lalu.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-bold text-slate-900">Pembayaran Iuran Air</h4>
                <p className="text-slate-500 leading-relaxed">
                  Iuran dapat dibayarkan langsung saat petugas keliling berkunjung (door-to-door) atau di Kantor KPSPAMS masing-masing dusun.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-bold text-slate-900">Bantuan &amp; Aduan Warga</h4>
                <p className="text-slate-500 leading-relaxed">
                  Jika mengalami air mati, pipa bocor, atau meteran rusak, ajukan pengaduan langsung melalui portal ini untuk penanganan teknisi.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STATE 2: LIVE CUSTOMER DASHBOARD (Data Riil & Integrasi Lengkap)           */
          /* ========================================================================= */
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 sm:px-5 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={handleResetSearch}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-brand-maroon-900 transition px-3 py-1.5 rounded-xl hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4 text-brand-maroon-800" />
                <span>Cari Nomor SR Lain</span>
              </button>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Nomor Sambungan Rumah:
                </span>
                <span className="font-mono text-xs font-bold text-brand-maroon-900">
                  {data.connection.connection_no}
                </span>
              </div>
            </div>

            {/* Real Customer Profile Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Akun Sambungan Terdaftar
                  </span>
                  <Badge variant={data.connection.status === "ACTIVE" ? "success" : "danger"} size="sm">
                    {data.connection.status === "ACTIVE" ? "Sambungan Aktif" : data.connection.status}
                  </Badge>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {data.customer.tariff_type}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {data.customer.full_name}
                </h2>
                <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-2">
                  <span>
                    No. SR: <strong className="font-mono text-brand-maroon-900 font-bold">{data.connection.connection_no}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    NIK: <strong className="font-mono text-slate-700">{data.customer.nik_masked}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dusun {data.customer.dusun}</span>
                  </span>
                  <span>•</span>
                  <span>
                    Meter: <strong className="font-mono text-slate-700">{data.connection.meter_brand} ({data.connection.meter_serial})</strong>
                  </span>
                  <span>•</span>
                  <span className="text-slate-700 font-bold">{data.connection.kpspams_name}</span>
                </div>
              </div>
            </div>

            {/* Real Hero Active Bill Card */}
            {data.current_bill ? (
              <div
                className={`text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden border ${
                  data.current_bill.is_paid
                    ? "bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border-emerald-500/40"
                    : "bg-gradient-to-br from-brand-maroon-950 via-brand-maroon-900 to-slate-950 border-brand-maroon-700"
                }`}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
                  <div>
                    <div className="text-2xl sm:text-4xl lg:text-5xl font-black font-tabular tracking-tight">
                      Rp {data.current_bill.total_amount.toLocaleString("id-ID")},-
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                      <span className="text-amber-300/90 font-semibold">
                        {data.current_bill.period_name}
                      </span>
                      <span>•</span>
                      <span className="text-slate-300">
                        No. Invoice: <strong className="font-mono text-white">{data.current_bill.invoice_number}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-slate-300">
                        Pemakaian: <strong>{data.current_bill.usage_m3} m³</strong>
                      </span>
                    </div>

                    {/* Status Badge & Narrative */}
                    <div className="mt-3.5">
                      {data.current_bill.is_paid ? (
                        <div className="space-y-1.5">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 text-xs font-black inline-flex items-center space-x-1.5 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>TAGIHAN RESMI TELAH LUNAS</span>
                          </span>
                          <p className="text-[11px] sm:text-xs text-emerald-200/90 leading-relaxed">
                            Terbayar pada: <strong>{formatDateIndo(data.current_bill.paid_at)}</strong> • Metode: {data.current_bill.payment_method || "Kasir Lapangan (Tunai)"}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-300">
                            Terima kasih telah membayar iuran tepat waktu untuk kelancaran air bersih warga Desa Kuajang.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="px-3 py-1 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/40 text-xs font-black inline-flex items-center space-x-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            <span>BELUM LUNAS (Jatuh Tempo: {formatDateIndo(data.current_bill.due_date)})</span>
                          </span>
                          <p className="text-[11px] text-amber-100/90 leading-relaxed">
                            Pembayaran dapat diserahkan saat petugas keliling berkunjung ke rumah atau transfer ke {data.connection.kpspams_bank || "Rekening BRI KPSPAMS"}.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons depending on payment status */}
                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    {data.current_bill.is_paid ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setReceiptModalOpen(true)}
                          className="px-4 py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-xl transition active:scale-95 flex items-center justify-center space-x-2"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Cetak Kwitansi Lunas</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInvoiceModalOpen(true)}
                          className="px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition active:scale-95 flex items-center justify-center space-x-1.5"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Rincian Faktur</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href={getWhatsAppLink(false)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition active:scale-95 flex items-center justify-center space-x-2"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Bayar via Petugas (WA)</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setInvoiceModalOpen(true)}
                          className="px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition active:scale-95 flex items-center justify-center space-x-1.5"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Rincian Faktur</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200 text-center">
                <p className="text-slate-500 text-xs">Belum ada tagihan resmi terbit untuk sambungan ini.</p>
              </div>
            )}

            {/* Real 6-Month Water Consumption History Chart from Server */}
            {data.consumption_history && data.consumption_history.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-xs sm:text-base font-bold text-slate-900">
                      Riwayat Pemakaian Air Bersih (6 Bulan Terakhir)
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      Catatan kubikasi meteran pada sambungan {data.customer.full_name}
                    </p>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Satuan m³
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1 sm:gap-3 pt-6 pb-2 items-end h-40 sm:h-48 border-b border-slate-100 text-center">
                  {data.consumption_history.map((item, i) => {
                    const isLatest = i === data.consumption_history.length - 1;
                    const heightPercent = Math.max(12, Math.round((item.usage_m3 / maxUsage) * 100));

                    return (
                      <div key={i} className="flex flex-col items-center group relative">
                        <span className="text-[10px] sm:text-xs font-black text-slate-800 font-tabular mb-1">
                          {item.usage_m3}m³
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-7 sm:w-16 rounded-t-lg sm:rounded-t-xl transition-all ${
                            isLatest
                              ? "bg-gradient-to-t from-brand-maroon-900 to-brand-maroon-700 shadow-md shadow-brand-maroon-900/30"
                              : "bg-slate-200 hover:bg-slate-300"
                          }`}
                        />
                        <span
                          className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-bold ${
                            isLatest ? "text-brand-maroon-900 font-extrabold" : "text-slate-500"
                          }`}
                        >
                          {item.month}
                        </span>

                        {/* Tooltip on hover */}
                        <div className="hidden sm:group-hover:block absolute -top-12 z-20 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg pointer-events-none whitespace-nowrap">
                          {item.has_reading
                            ? `Stand Lalu: ${item.previous_reading}m³ | Kini: ${item.current_reading}m³`
                            : "Belum ada pencatatan meter"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-1">
                  <span>Pencatatan meteran dilakukan petugas setiap tanggal 1-5 bulan berjalan.</span>
                  <span className="font-mono text-slate-500">
                    Stand Terakhir: <strong>{data.consumption_history[data.consumption_history.length - 1]?.current_reading || 0} m³</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Riwayat Pengaduan Terkini Jika Pernah Melapor */}
            {data.recent_complaints && data.recent_complaints.length > 0 && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-4 h-4 text-brand-maroon-800" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Status Pengaduan Gangguan Air Sambungan Ini
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Terhubung ke Teknisi</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {data.recent_complaints.map((comp) => (
                    <div key={comp.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-brand-maroon-900 text-[11px]">
                            {comp.ticket_number}
                          </span>
                          <span className="text-slate-600 font-semibold">• {comp.category}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5 truncate max-w-md">
                          {comp.description}
                        </p>
                      </div>
                      <div>
                        {comp.status === "RESOLVED" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Selesai</span>
                          </span>
                        ) : comp.status === "IN_PROGRESS" ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Ditangani Teknisi</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            Menunggu Penugasan
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Report Problem / Complaint Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Mengalami Gangguan Air Bersih?</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Laporkan pipa bocor, air keruh, meter mati, atau tekanan rendah langsung ke sistem teknisi {data.connection.kpspams_name}.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto font-bold"
                  onClick={() => {
                    setTicketGenerated(null);
                    setComplaintModalOpen(true);
                  }}
                >
                  Ajukan Pengaduan
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="max-w-4xl w-full mx-auto px-4 text-center py-6 text-xs text-slate-400 border-t border-slate-200 mt-8 space-y-1">
        <p className="font-medium text-slate-600">© 2026 Pemerintah Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar.</p>
        <p className="text-[11px] text-slate-400">
          SI-KPSPAMS KUAJANG • Layanan Transparansi Air Bersih Terpadu
        </p>
        <p className="text-[11px] text-slate-500 pt-1">
          Dirancang &amp; Dikembangkan oleh <span className="font-semibold text-slate-700">Pua Kaso</span>
        </p>
      </footer>

      {/* Real Complaint Modal with Server Backend Submission */}
      {complaintModalOpen && data && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            {ticketGenerated ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-900">Laporan Pengaduan Terkirim ke Server!</h4>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 inline-block font-mono font-bold text-brand-maroon-900 text-sm">
                  Nomor Tiket: {ticketGenerated}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Laporan untuk No. SR <strong>{data.connection.connection_no}</strong> ({data.customer.full_name}) telah tercatat di server {data.connection.kpspams_name} dan siap ditugaskan ke teknisi lapangan.
                </p>
                <div className="pt-2">
                  <Button variant="primary" size="md" className="w-full font-bold" onClick={() => setComplaintModalOpen(false)}>
                    Selesai
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">Formulir Pengaduan Warga</h4>
                    <p className="text-[11px] text-slate-400">
                      No. SR: {data.connection.connection_no} ({data.customer.full_name})
                    </p>
                  </div>
                  <button type="button" onClick={() => setComplaintModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {complaintError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                    {complaintError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Kategori Masalah:
                  </label>
                  <select
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                  >
                    <option value="AIR_MATI">Air Tidak Mengalir Sama Sekali</option>
                    <option value="TEKANAN_RENDAH">Tekanan Air Sangat Lemah</option>
                    <option value="PIPA_BOCOR">Pipa Distribusi / Sambungan Bocor</option>
                    <option value="METER_RUSAK">Meter Air Mati / Angka Buram</option>
                    <option value="KUALITAS_AIR">Air Keruh / Berbau</option>
                    <option value="TAGIHAN">Koreksi Tagihan Tidak Wajar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Deskripsi Detail Gangguan:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    placeholder="Jelaskan kondisi gangguan dan patokan rumah Anda..."
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setComplaintModalOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={isSubmittingComplaint}
                    className="font-bold"
                    icon={isSubmittingComplaint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  >
                    {isSubmittingComplaint ? "Mengirim ke Server..." : "Kirim Pengaduan"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Rincian Faktur Resmi */}
      {invoiceModalOpen && data?.current_bill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-brand-maroon-700" />
                <h4 className="text-base font-extrabold text-slate-900">Rincian Faktur Resmi</h4>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Faktur:</span>
                  <span className="font-mono font-bold text-slate-900">{data.current_bill.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="font-bold text-slate-900">{data.customer.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Sambungan (SR):</span>
                  <span className="font-mono font-bold text-brand-maroon-800">{data.connection.connection_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Periode Tagihan:</span>
                  <span className="font-medium text-slate-700">{data.current_bill.period_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jatuh Tempo:</span>
                  <span className="font-medium text-slate-700">{formatDateIndo(data.current_bill.due_date)}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Pemakaian Air ({data.current_bill.usage_m3} m³):</span>
                  <span className="font-tabular font-medium">Rp {data.current_bill.water_amount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Administrasi &amp; Operasional:</span>
                  <span className="font-tabular font-medium">Rp {data.current_bill.admin_fee.toLocaleString("id-ID")}</span>
                </div>
                {data.current_bill.maintenance_fee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Pemeliharaan Meter:</span>
                    <span className="font-tabular font-medium">Rp {data.current_bill.maintenance_fee.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {data.current_bill.penalty_fee > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Denda Keterlambatan:</span>
                    <span className="font-tabular font-medium">Rp {data.current_bill.penalty_fee.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Tagihan:</span>
                  <span className="font-tabular text-brand-maroon-900">Rp {data.current_bill.total_amount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between font-semibold text-xs pt-1">
                  <span>Status Pembayaran:</span>
                  <Badge variant={data.current_bill.is_paid ? "success" : "danger"} size="sm">
                    {data.current_bill.is_paid ? "LUNAS" : "BELUM LUNAS"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setInvoiceModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kwitansi Lunas Resmi (Printable Official Receipt) */}
      {receiptModalOpen && data?.current_bill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-7 border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Header Dialog */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 print:hidden">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-emerald-700" />
                <h4 className="text-base font-extrabold text-slate-900">Kwitansi Pembayaran Resmi</h4>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 border-2 border-dashed border-amber-300/80 space-y-4 font-mono text-slate-800">
              {/* Kop Kwitansi */}
              <div className="text-center border-b border-dashed border-amber-300/80 pb-3">
                <p className="text-[10px] tracking-widest uppercase text-slate-500 font-bold">PEMERINTAH DESA KUAJANG</p>
                <h3 className="text-base font-black text-slate-950 uppercase">{data.connection.kpspams_name}</h3>
                <p className="text-[10px] text-slate-600">
                  {data.connection.kpspams_address || "Dusun Lemo Baru RT 02, Desa Kuajang, Kec. Binuang"}
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  BUKTI PEMBAYARAN IURAN AIR RESMI (LUNAS)
                </p>
              </div>

              {/* Data Transaksi & Pelanggan */}
              <div className="text-xs space-y-1.5 border-b border-dashed border-amber-300/80 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">No. Kwitansi:</span>
                  <span className="font-bold text-slate-950">{data.current_bill.receipt_number || "KW/202610/KP01/LUNAS"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">No. Invoice:</span>
                  <span className="font-bold text-slate-900">{data.current_bill.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">No. Sambungan (SR):</span>
                  <span className="font-bold text-brand-maroon-900">{data.connection.connection_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Nama Pelanggan:</span>
                  <span className="font-black text-slate-950 uppercase">{data.customer.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Lokasi / Dusun:</span>
                  <span>Dusun {data.customer.dusun}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Periode Tagihan:</span>
                  <span className="font-bold text-slate-900">{data.current_bill.period_name}</span>
                </div>
              </div>

              {/* Rincian Meter & Kubikasi */}
              <div className="text-xs space-y-1.5 border-b border-dashed border-amber-300/80 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Seri Meter Air:</span>
                  <span>{data.connection.meter_brand} ({data.connection.meter_serial})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Volume Pemakaian:</span>
                  <span className="font-black text-slate-900">{data.current_bill.usage_m3} m³</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Biaya Pemakaian Air:</span>
                  <span>Rp {data.current_bill.water_amount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Beban Administrasi:</span>
                  <span>Rp {data.current_bill.admin_fee.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Total & Pelunasan */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm font-black text-slate-950 pt-1">
                  <span>TOTAL PEMBAYARAN:</span>
                  <span className="text-emerald-800">Rp {data.current_bill.total_amount.toLocaleString("id-ID")},-</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-700">
                  <span>STATUS PEMBAYARAN:</span>
                  <span>✓ LUNAS (SELESAI)</span>
                </div>
                <div className="text-[11px] text-slate-600 pt-1">
                  <span>Tanggal Lunas: {formatDateIndo(data.current_bill.paid_at)}</span>
                  <br />
                  <span>Metode: {data.current_bill.payment_method || "Kasir Lapangan (Tunai)"}</span>
                </div>
              </div>

              {/* Cap Stempel Digital */}
              <div className="pt-3 border-t border-dashed border-amber-300/80 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Validitas Digital SI-KPSPAMS</span>
                </div>
                <span className="font-mono text-[9px]">Kuajang, Polman</span>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 print:hidden">
              <span className="text-[11px] text-slate-500">
                Struk ini sah sebagai bukti pembayaran iuran air resmi.
              </span>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button variant="secondary" size="sm" onClick={() => setReceiptModalOpen(false)}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.print()}
                  icon={<Printer className="w-4 h-4" />}
                  className="font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  Cetak / Simpan PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CitizenPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-brand-maroon-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Memuat Portal Mandiri Warga...</p>
          </div>
        </div>
      }
    >
      <CitizenPortalContent />
    </Suspense>
  );
}
