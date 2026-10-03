"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { DEMO_KPSPAMS_LIST, DEMO_CUSTOMERS, DemoCustomer } from "@/lib/demo-data";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
} from "lucide-react";
import { DashboardAnalyticsCharts } from "@/components/charts/DashboardAnalyticsCharts";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

function DashboardContent() {
  const { activeKpspamsId, activeKpspamsName, isDesaLevel, user } = useAuth();

  // Ambil data pelanggan riil yang tersimpan di sistem / localStorage
  const [registeredCustomers, setRegisteredCustomers] = useState<DemoCustomer[]>(DEMO_CUSTOMERS);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kpspams_customers");
      if (saved) {
        try {
          const parsed: DemoCustomer[] = JSON.parse(saved);
          const sanitized = parsed.map((c) => ({
            ...c,
            billingStatus: "UNPAID" as const,
          }));
          localStorage.setItem("kpspams_customers", JSON.stringify(sanitized));
          setRegisteredCustomers(sanitized);
          return;
        } catch (e) {
          console.error("Gagal parse kpspams_customers", e);
        }
      }
    }
  }, []);

  // Filter pelanggan berdasarkan unit yang aktif
  const filteredCustomers =
    activeKpspamsId === null
      ? registeredCustomers
      : registeredCustomers.filter((c) => c.kpspamsId === activeKpspamsId);

  const realCustomerCount = filteredCustomers.length;

  // Hitung metrik dinamis berdasarkan KPSPAMS yang aktif
  const currentUnits =
    activeKpspamsId === null
      ? DEMO_KPSPAMS_LIST
      : DEMO_KPSPAMS_LIST.filter((k) => k.id === activeKpspamsId);

  const totalUsage = currentUnits.reduce((acc, curr) => acc + curr.waterUsageThisMonth, 0);
  const totalBilled = currentUnits.reduce((acc, curr) => acc + curr.totalBilled, 0);
  const totalCollected = currentUnits.reduce((acc, curr) => acc + curr.totalCollected, 0);
  const totalArrears = currentUnits.reduce((acc, curr) => acc + curr.outstandingArrears, 0);
  const totalCash = currentUnits.reduce((acc, curr) => acc + curr.cashBalance, 0);
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Scope Status Banner */}
      <div className="bg-gradient-to-r from-brand-maroon-900 via-brand-maroon-800 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-brand-maroon-700/60 relative overflow-hidden">
        {/* Glow Decor */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              {activeKpspamsId === null
                ? "Dashboard Konsolidasi Desa Kuajang"
                : `Dashboard Operasional ${activeKpspamsName}`}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200">
                <Clock className="w-3.5 h-3.5 text-brand-gold-400" />
                <span>Siklus Penagihan: <strong>Tgl 5 Setiap Bulan</strong></span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-brand-gold-500/15 border border-brand-gold-500/40 text-brand-gold-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold-400" />
                <span>Go-Live Lapangan: <strong>Mulai 5 Oktober 2026</strong></span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />}
              onClick={() => alert("Ekspor laporan konsolidasi XLSX sedang disiapkan...")}
            >
              Ekspor Excel
            </Button>
            <Link href="/dashboard/penagihan-lapangan">
              <Button variant="gold" size="sm" icon={<Smartphone className="w-3.5 h-3.5" />}>
                Catat & Tagih Lapangan
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Responsive 2 cols on mobile, 3 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
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
            {realCustomerCount} Sambungan Rumah (SR) terdaftar aktif di sistem
          </p>
        </Card>

        {/* Metric 2 */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Pemakaian Air
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-3xl font-black text-slate-900 font-tabular">
              {totalUsage.toLocaleString("id-ID")}
              <span className="text-xs sm:text-sm font-normal text-slate-500 ml-1">m³</span>
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {totalUsage === 0
              ? "Pencatatan meter dimulai tgl 5 Oktober"
              : `Rata-rata ${(totalCustomers > 0 ? (totalUsage / totalCustomers).toFixed(1) : 0)} m³/SR`}
          </p>
        </Card>

        {/* Metric 3 */}
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
              Rp {totalCollected.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {collectionRate}%
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {totalCollected === 0
              ? "Realisasi Rp 0 • Penagihan dimulai tgl 5 Oktober"
              : `Realisasi tagihan Rp ${totalBilled.toLocaleString("id-ID")} (Setoran Lapangan & Loket)`}
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
              Rp {totalArrears.toLocaleString("id-ID")}
            </span>
            {totalArrears === 0 ? (
              <Badge variant="success" size="sm">Nihil</Badge>
            ) : (
              <Badge variant="danger" size="sm">Outstanding</Badge>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {totalArrears === 0 ? "Tidak ada tunggakan berjalan" : "Piutang periode aktif"}
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
              Rp {totalCash.toLocaleString("id-ID")}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {totalCash === 0 ? "Siap input saldo awal kas per 5 Oktober" : "Termasuk Opening Balance"}
          </p>
        </Card>

        {/* Metric 6 */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Status Operasional
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-3xl font-black text-slate-900 font-tabular">
              1 <span className="text-xs sm:text-sm font-normal text-slate-500">Unit Pilot</span>
            </span>
            <Badge variant="brand" size="sm">Lemo Baru Live</Badge>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            Pilot: Lemo Baru • Lemo Tua & Sarampu Tahap 2
          </p>
        </Card>
      </div>

      {/* Visual Analytics & Performance Charts */}
      <DashboardAnalyticsCharts
        activeKpspamsId={activeKpspamsId}
        activeKpspamsName={activeKpspamsName}
      />

      {/* Rincian Operasional Per Unit KPSPAMS */}
      <Card>
        <CardHeader
          title="Rincian Operasional & Keuangan Unit KPSPAMS"
          subtitle="Data per unit penyedia air minum perdesaan di Desa Kuajang"
        />

        {/* Mobile View: Unit Cards (< md) */}
        <div className="md:hidden space-y-3">
          {DEMO_KPSPAMS_LIST.map((unit) => (
            <div
              key={unit.id}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">{unit.name}</div>
                  <div className="text-[10px] text-slate-500">Ketua: {unit.head} ({unit.code})</div>
                </div>
                {unit.id === 1 ? (
                  <Badge variant="brand" size="sm">Pilot Project (Live)</Badge>
                ) : (
                  <Badge variant="warning" size="sm">Persiapan Tahap 2</Badge>
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
                  <div className="text-[10px] text-slate-400">Pelanggan & Pemakaian</div>
                  <div className="font-bold text-slate-800">
                    {unit.activeCustomers} SR • {unit.waterUsageThisMonth.toLocaleString("id-ID")} m³
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Penerimaan Iuran</div>
                  <div className="font-bold text-emerald-700 font-tabular">
                    Rp {unit.totalCollected.toLocaleString("id-ID")}
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
                <th className="py-3 px-4 text-right">Pemakaian (m³)</th>
                <th className="py-3 px-4 text-right">Tagihan Terbit</th>
                <th className="py-3 px-4 text-right">Terbayar</th>
                <th className="py-3 px-4 text-right">Tunggakan</th>
                <th className="py-3 px-4 text-center">Status Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEMO_KPSPAMS_LIST.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <span>{unit.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({unit.code})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">Ketua: {unit.head}</div>
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
                    {unit.activeCustomers} SR
                  </td>
                  <td className="py-3.5 px-4 text-right font-tabular text-slate-800 font-medium">
                    {unit.waterUsageThisMonth.toLocaleString("id-ID")} m³
                  </td>
                  <td className="py-3.5 px-4 text-right font-tabular font-medium text-slate-800">
                    Rp {unit.totalBilled.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 px-4 text-right font-tabular font-bold text-emerald-700">
                    Rp {unit.totalCollected.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 px-4 text-right font-tabular font-bold text-rose-600">
                    Rp {unit.outstandingArrears.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {unit.id === 1 ? (
                      <Badge variant="brand" size="sm">Pilot Project (Live)</Badge>
                    ) : (
                      <Badge variant="warning" size="sm">Persiapan Tahap 2</Badge>
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
