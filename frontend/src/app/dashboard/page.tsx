"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { DEMO_KPSPAMS_LIST, DEMO_CUSTOMERS, DemoCustomer } from "@/lib/demo-data";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import {
  Users,
  Activity,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Building,
  FileSpreadsheet,
  Plus,
  Sparkles,
  MapPin,
  Clock,
  Smartphone,
  RefreshCw,
  Gauge,
  Map,
  Compass,
} from "lucide-react";
import dynamic from "next/dynamic";

const DashboardAnalyticsCharts = dynamic(
  () => import("@/components/charts/DashboardAnalyticsCharts").then((m) => m.DashboardAnalyticsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 w-full animate-pulse bg-slate-900/40 rounded-2xl flex items-center justify-center border border-slate-800">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="w-6 h-6 border-2 border-brand-gold-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Memuat grafik analitik performa KPSPAMS...</span>
        </div>
      </div>
    ),
  }
);

interface OverviewApiData {
  context: {
    kpspams_id: number | null;
    scope_label: string;
    period: string;
  };
  kpi: {
    total_customers: number;
    active_connections: number;
    sealed_connections: number;
    disconnected_connections: number;
    total_usage_m3: number;
    total_physical_meter_m3?: number;
    total_billed: number;
    total_collected: number;
    total_arrears: number;
    collection_rate_percent: number;
    total_cash_balance: number;
    active_complaints: number;
  };
  dusun_breakdown: Array<{
    dusun_id: number;
    code: string;
    name: string;
    total_connections: number;
    total_usage_m3?: number;
    total_physical_meter_m3?: number;
  }>;
  unit_breakdown?: Array<{
    kpspams_id: number;
    code: string;
    name: string;
    dusuns: string[];
    total_customers: number;
    total_usage_m3?: number;
    total_physical_meter_m3?: number;
    total_billed: number;
    total_collected: number;
    total_arrears: number;
    cash_balance: number;
  }>;
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

function DashboardContent() {
  const { activeKpspamsId, activeKpspamsName, isDesaLevel, user } = useAuth();
  const [overviewData, setOverviewData] = useState<OverviewApiData | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(true);

  // Ambil data pelanggan riil yang tersimpan di sistem / localStorage sebagai fallback
  const [registeredCustomers, setRegisteredCustomers] = useState<DemoCustomer[]>(DEMO_CUSTOMERS);

  const fetchOverview = useCallback(async () => {
    setIsLoadingOverview(true);
    try {
      const url = "/dashboard/overview" + (activeKpspamsId ? `?kpspams_id=${activeKpspamsId}` : "");
      const res = await apiClient(url);
      if (res?.status === "success" && res.data) {
        setOverviewData(res.data);
      }
    } catch (err) {
      console.warn("Gagal memuat overview API, beralih ke cache:", err);
    } finally {
      setIsLoadingOverview(false);
    }
  }, [activeKpspamsId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kpspams_customers");
      if (saved) {
        try {
          const parsed: DemoCustomer[] = JSON.parse(saved);
          setRegisteredCustomers(parsed);
        } catch (e) {
          console.error("Gagal parse kpspams_customers", e);
        }
      }
    }
  }, []);

  // Filter pelanggan berdasarkan unit yang aktif (Fallback)
  const filteredCustomers =
    activeKpspamsId === null
      ? registeredCustomers
      : registeredCustomers.filter((c) => Number(c.kpspamsId) === Number(activeKpspamsId));

  const currentUnits =
    activeKpspamsId === null
      ? DEMO_KPSPAMS_LIST
      : DEMO_KPSPAMS_LIST.filter((k) => Number(k.id) === Number(activeKpspamsId));

  // Nilai metrik dari API Backend (Realtime) atau Fallback
  const realCustomerCount =
    overviewData?.kpi?.total_customers ??
    (overviewData as any)?.active_customers ??
    filteredCustomers.length;
  const totalCustomers = realCustomerCount;

  const dusunSumUsage = overviewData?.dusun_breakdown?.reduce(
    (acc: number, curr: any) => acc + (Number(curr.total_usage_m3) || 0),
    0
  );

  const totalUsage =
    dusunSumUsage && dusunSumUsage > 0
      ? dusunSumUsage
      : overviewData?.kpi?.total_usage_m3 ??
        (overviewData as any)?.total_consumption_m3 ??
        currentUnits.reduce((acc, curr) => acc + curr.waterUsageThisMonth, 0);

  const dusunSumPhysicalMeter = overviewData?.dusun_breakdown?.reduce(
    (acc: number, curr: any) => acc + (Number(curr.total_physical_meter_m3) || 0),
    0
  );

  const totalPhysicalMeter =
    overviewData?.kpi?.total_physical_meter_m3 ??
    (dusunSumPhysicalMeter && dusunSumPhysicalMeter > 0 ? dusunSumPhysicalMeter : undefined) ??
    currentUnits.reduce((acc, curr) => acc + (curr.totalPhysicalMeterM3 || 0), 0);

  const totalBilled =
    overviewData?.kpi?.total_billed ??
    (overviewData as any)?.total_billed ??
    currentUnits.reduce((acc, curr) => acc + curr.totalBilled, 0);

  const totalCollected =
    overviewData?.kpi?.total_collected ??
    (overviewData as any)?.total_collected ??
    currentUnits.reduce((acc, curr) => acc + curr.totalCollected, 0);

  const totalArrears =
    overviewData?.kpi?.total_arrears ??
    (overviewData as any)?.total_unpaid ??
    currentUnits.reduce((acc, curr) => acc + curr.outstandingArrears, 0);

  const totalCash =
    overviewData?.kpi?.total_cash_balance ??
    currentUnits.reduce((acc, curr) => acc + curr.cashBalance, 0);

  const collectionRate =
    overviewData?.kpi?.collection_rate_percent !== undefined
      ? String(overviewData.kpi.collection_rate_percent)
      : (overviewData as any)?.collection_rate !== undefined
      ? String((overviewData as any).collection_rate)
      : totalBilled > 0
      ? ((totalCollected / totalBilled) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Scope Status Banner */}
      <div className="bg-gradient-to-r from-brand-maroon-900 via-brand-maroon-800 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-brand-maroon-700/60 relative overflow-hidden">
        {/* Glow Decor */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{overviewData?.context?.period || "Periode Berjalan Oktober 2026"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              {activeKpspamsId === null
                ? (overviewData?.context?.scope_label || "Dashboard Konsolidasi Desa Kuajang")
                : `Dashboard Operasional ${activeKpspamsName}`}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingOverview ? "animate-spin" : ""}`} />}
              onClick={fetchOverview}
              disabled={isLoadingOverview}
            >
              Segarkan Data
            </Button>
            <Link href="/dashboard/peta-gis">
              <Button variant="secondary" size="sm" icon={<Map className="w-3.5 h-3.5 text-cyan-400" />}>
                Peta Master GIS
              </Button>
            </Link>
            <Link href="/dashboard/penagihan-lapangan">
              <Button variant="gold" size="sm" icon={<Smartphone className="w-3.5 h-3.5" />}>
                Catat & Tagih Lapangan
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access Card: Peta Master GIS Sebaran Jaringan Air Bersih Desa Kuajang */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-950/50">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Peta Master GIS Sebaran Jaringan Air Bersih Desa Kuajang
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-brand-gold-500/20 text-brand-gold-300 border border-brand-gold-500/30 text-[10px] font-bold">
                Fitur Visual Spasial 37+ Titik
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Pantau seluruh titik rumah warga dengan indikator warna: 🟢 Lunas, 🔴 Menunggak, 🟡 Pengaduan Gangguan Pipa Bocor/Air Mati, serta 🔵 5 Bak Reservoir &amp; Jalur Pipa Aliran.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/peta-gis"
          className="flex-shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-950/40 transition active:scale-95 border border-cyan-400/30"
        >
          <Map className="w-4 h-4" />
          <span>Buka Peta Satelit Master GIS &rarr;</span>
        </Link>
      </div>

      {/* KPI Cards Grid (Responsive 1 col on mobile, 2 cols on tablet, 3 cols on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Metric 1 */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Pelanggan Aktif
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-3xl font-black text-slate-900 font-tabular">
              {realCustomerCount}
              <span className="text-xs sm:text-sm font-semibold text-slate-400 ml-1.5">
                Sambungan Rumah (SR)
              </span>
            </span>
            <span className="text-[11px] text-emerald-600 font-bold hidden sm:flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
              Aktif Terdata
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {overviewData?.kpi?.active_connections !== undefined
              ? `${overviewData.kpi.active_connections} SR aktif • ${overviewData.kpi.sealed_connections || 0} tersegel`
              : `${realCustomerCount} Sambungan Rumah (SR) terdaftar aktif di sistem`}
          </p>
        </Card>

        {/* Metric 2: Pemakaian Air Bulan Berjalan */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Pemakaian Air Bulan Ini
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-3xl font-black text-slate-900 font-tabular">
              {Number(totalUsage).toLocaleString("id-ID")}
              <span className="text-xs sm:text-sm font-normal text-slate-500 ml-1">m³</span>
            </span>
            <Badge variant="brand" size="sm">Bulan Berjalan</Badge>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {totalUsage === 0
              ? "Masa transisi stand awal • Beban dasar Rp 10.000/SR"
              : `Rata-rata ${(totalCustomers > 0 ? (Number(totalUsage) / totalCustomers).toFixed(1) : 0)} m³/SR`}
          </p>
        </Card>

        {/* Metric 3: Total Stand Fisik Meteran (Odometer SR) */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Stand Fisik Meteran
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-3xl font-black text-indigo-950 font-tabular">
              {Number(totalPhysicalMeter).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
              <span className="text-xs sm:text-sm font-normal text-slate-500 ml-1">m³</span>
            </span>
            <Badge variant="neutral" size="sm">Odometer SR</Badge>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            Total akumulasi putaran meter fisik {realCustomerCount} SR di lapangan
          </p>
        </Card>

        {/* Metric 4: Penerimaan Iuran Air */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Penerimaan Iuran Air
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className="text-lg sm:text-2xl font-black text-emerald-700 font-tabular truncate">
              Rp {Number(totalCollected).toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {collectionRate}%
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {totalCollected === 0
              ? "Realisasi Rp 0 • Penagihan periode berjalan"
              : `Realisasi tagihan Rp ${Number(totalBilled).toLocaleString("id-ID")} (Setoran Kasir & Lapangan)`}
          </p>
        </Card>

        {/* Metric 4 */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Tunggakan Berjalan
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className="text-lg sm:text-2xl font-black text-rose-700 font-tabular truncate">
              Rp {Number(totalArrears).toLocaleString("id-ID")}
            </span>
            {totalArrears === 0 ? (
              <Badge variant="success" size="sm">Nihil</Badge>
            ) : (
              <Badge variant="danger" size="sm">Outstanding</Badge>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {totalArrears === 0 ? "Tidak ada piutang tertunggak" : "Piutang berjalan di database"}
          </p>
        </Card>

        {/* Metric 5 */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Saldo Kas Unit
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className="text-lg sm:text-2xl font-black text-slate-900 font-tabular truncate">
              Rp {Number(totalCash).toLocaleString("id-ID")}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {totalCash === 0 ? "Buku kas operasional tersinkronisasi" : "Tercatat di Buku Kas Resmi"}
          </p>
        </Card>

        {/* Metric 6 */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Pengaduan Aktif
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-3xl font-black text-slate-900 font-tabular">
              {overviewData?.kpi?.active_complaints ?? 0}{" "}
              <span className="text-xs sm:text-sm font-normal text-slate-500">Tiket</span>
            </span>
            <Badge variant={(overviewData?.kpi?.active_complaints ?? 0) > 0 ? "warning" : "success"} size="sm">
              {(overviewData?.kpi?.active_complaints ?? 0) > 0 ? "Perlu Respons" : "Layanan Normal"}
            </Badge>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            Keluhan warga aktif yang dalam penanganan SPK
          </p>
        </Card>
      </div>

      {/* Visual Analytics & Performance Charts */}
      <DashboardAnalyticsCharts
        activeKpspamsId={activeKpspamsId}
        activeKpspamsName={activeKpspamsName}
        overviewData={overviewData}
      />

      {/* Rincian Operasional Per Unit KPSPAMS */}
      <Card>
        <CardHeader
          title="Rincian Operasional & Keuangan Unit KPSPAMS"
          subtitle="Data per unit penyedia air minum perdesaan di Desa Kuajang langsung dari basis data"
        />

        {/* Mobile View: Unit Cards (< md) */}
        <div className="md:hidden space-y-3">
          {(overviewData?.unit_breakdown || DEMO_KPSPAMS_LIST.map(u => ({
            kpspams_id: u.id,
            code: u.code,
            name: u.name,
            dusuns: u.dusuns,
            total_customers: u.activeCustomers,
            total_billed: u.totalBilled,
            total_collected: u.totalCollected,
            total_arrears: u.outstandingArrears,
            cash_balance: u.cashBalance,
          }))).map((unit) => (
            <div
              key={unit.kpspams_id}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">{unit.name}</div>
                  <div className="text-[10px] text-slate-500">Kode: {unit.code}</div>
                </div>
                {unit.kpspams_id === 1 ? (
                  <Badge variant="brand" size="sm">Pilot Project (Live)</Badge>
                ) : (
                  <Badge variant="warning" size="sm">Persiapan Operasional</Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {unit.dusuns.map((d, i) => (
                  <span
                    key={i}
                    className="inline-block bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium"
                  >
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Pelanggan Aktif</div>
                  <div className="font-bold text-slate-800">
                    {unit.total_customers} SR
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Penerimaan Iuran</div>
                  <div className="font-bold text-emerald-700 font-tabular">
                    Rp {Number(unit.total_collected).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Unit KPSPAMS</th>
                <th className="py-3 px-4">Wilayah Layanan</th>
                <th className="py-3 px-4 text-right">Pelanggan</th>
                <th className="py-3 px-4 text-right">Tagihan Terbit</th>
                <th className="py-3 px-4 text-right">Terbayar</th>
                <th className="py-3 px-4 text-right">Tunggakan</th>
                <th className="py-3 px-4 text-right">Saldo Kas</th>
                <th className="py-3 px-4 text-center">Status Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(overviewData?.unit_breakdown || DEMO_KPSPAMS_LIST.map(u => ({
                kpspams_id: u.id,
                code: u.code,
                name: u.name,
                dusuns: u.dusuns,
                total_customers: u.activeCustomers,
                total_billed: u.totalBilled,
                total_collected: u.totalCollected,
                total_arrears: u.outstandingArrears,
                cash_balance: u.cashBalance,
              }))).map((unit) => (
                <tr key={unit.kpspams_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <span>{unit.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({unit.code})</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {unit.dusuns.map((d, i) => (
                      <span
                        key={i}
                        className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] mr-1 mb-1 font-medium"
                      >
                        {d}
                      </span>
                    ))}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-800 font-tabular">
                    {unit.total_customers} SR
                  </td>
                  <td className="py-3.5 px-4 text-right font-tabular font-medium text-slate-800">
                    Rp {Number(unit.total_billed).toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 px-4 text-right font-tabular font-bold text-emerald-700">
                    Rp {Number(unit.total_collected).toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 px-4 text-right font-tabular font-bold text-rose-600">
                    Rp {Number(unit.total_arrears).toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 px-4 text-right font-tabular font-bold text-slate-900">
                    Rp {Number(unit.cash_balance).toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {unit.kpspams_id === 1 ? (
                      <Badge variant="brand" size="sm">Pilot Project (Live)</Badge>
                    ) : (
                      <Badge variant="warning" size="sm">Persiapan Operasional</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
