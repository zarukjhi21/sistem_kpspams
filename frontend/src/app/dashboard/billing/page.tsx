"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DEMO_CUSTOMERS, DemoCustomer } from "@/lib/demo-data";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { WaBroadcastModal, BroadcastCustomer } from "@/components/billing/WaBroadcastModal";
import {
  MessageCircle,
  Smartphone,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  Phone,
  Copy,
  Check,
  Send,
  Sparkles,
  ExternalLink,
  DollarSign,
  AlertCircle,
  Calendar,
  Building2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

export default function BillingPage() {
  const { user, isDesaLevel, activeKpspamsId } = useAuth();

  // State Pelanggan
  const [customers, setCustomers] = useState<DemoCustomer[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kpspams_customers");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            Array.isArray(parsed) &&
            !parsed.some((c: any) => c.name === "Baharuddin S." || c.connectionNo === "SR-LMB-00005")
          ) {
            return parsed;
          }
        } catch {
          // fallback
        }
      }
    }
    return DEMO_CUSTOMERS;
  });

  const [unpaidInvoices, setUnpaidInvoices] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDusun, setFilterDusun] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "UNPAID" | "PAID">("ALL");
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Multi-tenant Isolation: Filter sesuai KPSPAMS aktif / user tenant
  const effectiveKpspamsId =
    !isDesaLevel && user?.kpspamsId
      ? Number(user.kpspamsId)
      : activeKpspamsId !== null && activeKpspamsId !== undefined
      ? Number(activeKpspamsId)
      : 1;

  const filteredByTenant = useMemo(() => {
    if (effectiveKpspamsId === null) return customers;
    return customers.filter((c) => Number(c.kpspamsId) === Number(effectiveKpspamsId));
  }, [customers, effectiveKpspamsId]);

  // Fetch data terbaru dari API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const custRes = await apiClient("/customers?per_page=100");
      if (custRes?.status === "success" && Array.isArray(custRes.data) && custRes.data.length > 0) {
        const mapped: DemoCustomer[] = custRes.data.map((item: any) => {
          const primaryConn = item.connections?.[0];
          const rawReading =
            item.last_reading ??
            item.lastReading ??
            item.initial_reading ??
            primaryConn?.meter?.current_reading ??
            primaryConn?.meter?.initial_reading ??
            0;

          return {
            id: item.id,
            connectionNo:
              primaryConn?.connection_no ||
              primaryConn?.connection_number ||
              item.connection_no ||
              `SR-${item.id}`,
            name: item.full_name || item.name,
            nik: item.nik || "",
            address: item.identity_address || item.address,
            phone: item.phone,
            dusun: item.dusun || primaryConn?.dusun?.name || "Lemo Baru",
            kpspamsId: Number(item.kpspams_id || item.kpspams?.id || 1),
            kpspamsName:
              item.kpspams_name ||
              item.kpspams?.name ||
              (Number(item.kpspams_id) === 1 ? "KPSPAMS Lemo Baru" : `KPSPAMS Unit ${item.kpspams_id}`),
            meterSerial: item.meter_serial || primaryConn?.meter?.serial_number || "MTR-1001",
            lastReading: Number(rawReading) || 0,
            status: ((item.connection_status || item.status) === "ACTIVE"
              ? "ACTIVE"
              : "INACTIVE") as any,
            tariffType: item.customer_type?.name || "Rumah Tangga",
            billingStatus: item.billing_status || "UNPAID",
          };
        });
        setCustomers(mapped);
      }
    } catch (err) {
      console.warn("Gagal fetch pelanggan:", err);
    }

    try {
      const invRes = await apiClient("/invoices?per_page=100");
      if (invRes?.status === "success" && Array.isArray(invRes.data)) {
        const invMap: Record<string, any> = {};
        invRes.data.forEach((inv: any) => {
          const connNo = inv.connection_no || inv.connection?.connection_no;
          if (connNo) invMap[connNo] = inv;
          if (inv.customer_id) invMap[`CUST_${inv.customer_id}`] = inv;
        });
        setUnpaidInvoices(invMap);
      }
    } catch (err) {
      console.warn("Gagal fetch tagihan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeKpspamsId]);

  // Dusun unik
  const dusunList = useMemo(() => {
    const set = new Set<string>();
    filteredByTenant.forEach((c) => {
      if (c.dusun) set.add(c.dusun);
    });
    return Array.from(set);
  }, [filteredByTenant]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = filteredByTenant.length;
    const paid = filteredByTenant.filter((c) => c.billingStatus === "PAID").length;
    const unpaid = total - paid;
    const withPhone = filteredByTenant.filter((c) => !!c.phone).length;
    const totalAmount = total * 10000;
    const paidAmount = paid * 10000;
    const unpaidAmount = unpaid * 10000;
    return {
      total,
      paid,
      unpaid,
      withPhone,
      totalAmount,
      paidAmount,
      unpaidAmount,
      collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0,
    };
  }, [filteredByTenant]);

  // List untuk Broadcast Modal
  const broadcastList: BroadcastCustomer[] = useMemo(() => {
    return filteredByTenant.map((c) => {
      const inv = unpaidInvoices[c.connectionNo] || unpaidInvoices[`CUST_${c.id}`];
      return {
        id: c.id,
        name: c.name,
        connectionNo: c.connectionNo,
        phone: c.phone,
        dusun: c.dusun,
        kpspamsName:
          c.kpspamsName ||
          (Number(c.kpspamsId) === 1 ? "KPSPAMS Lemo Baru" : `KPSPAMS Unit ${c.kpspamsId}`),
        billingStatus: c.billingStatus,
        totalAmount: inv?.total_amount ? Number(inv.total_amount) : 10000,
        periodName: inv?.period_name || "Oktober 2026",
        dueDate: "20 Oktober 2026",
      };
    });
  }, [filteredByTenant, unpaidInvoices]);

  // Filter Table
  const tableData = useMemo(() => {
    return filteredByTenant.filter((c) => {
      if (filterDusun !== "ALL" && c.dusun !== filterDusun) return false;
      if (filterStatus === "PAID" && c.billingStatus !== "PAID") return false;
      if (filterStatus === "UNPAID" && c.billingStatus === "PAID") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = c.name.toLowerCase().includes(q);
        const mConn = c.connectionNo.toLowerCase().includes(q);
        const mPhone = (c.phone || "").toLowerCase().includes(q);
        const mDusun = c.dusun.toLowerCase().includes(q);
        if (!mName && !mConn && !mPhone && !mDusun) return false;
      }
      return true;
    });
  }, [filteredByTenant, filterDusun, filterStatus, searchQuery]);

  // Build Personalized WA Draft Message
  const getPersonalWaMessage = (customer: DemoCustomer) => {
    const kName = customer.kpspamsName || "KPSPAMS Lemo Baru";
    return (
      `Yth. Bpk/Ibu ${customer.name}, tagihan air bersih ${kName} periode Oktober 2026 ` +
      `sebesar Rp 10.000,- telah terbit. Jatuh tempo: 20 Oktober. ` +
      `Cek rincian di: sikpspams-kuajang.pages.dev/portal?sr=${customer.connectionNo}`
    );
  };

  const handleSendWa = (customer: DemoCustomer) => {
    if (!customer.phone) {
      alert(`Nomor WhatsApp untuk ${customer.name} belum terdaftar.`);
      return;
    }
    const clean = customer.phone.replace(/^0/, "62").replace(/\D/g, "");
    const msg = encodeURIComponent(getPersonalWaMessage(customer));
    window.open(`https://wa.me/${clean}?text=${msg}`, "_blank");
  };

  const handleCopyMessage = (customer: DemoCustomer) => {
    const msg = getPersonalWaMessage(customer);
    navigator.clipboard.writeText(msg);
    setCopiedId(customer.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-brand-maroon-900 via-slate-900 to-black text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-brand-maroon-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modul Notifikasi & Billing Resmi Desa Kuajang</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Billing & Pengingat Tagihan (Broadcast WA)
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Kirim notifikasi tagihan air bersih massal ke WhatsApp warga secara personal dalam satu
                klik, lengkapi nomor telepon warga, dan pantau status pelunasan periode berjalan.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(true)}
                className="flex items-center space-x-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/40 transition active:scale-95 border border-emerald-400/30"
              >
                <MessageCircle className="w-5 h-5 text-emerald-200" />
                <span>Kirim Pengingat Tagihan (Broadcast WA)</span>
              </button>

              <Link
                href="/dashboard/penagihan-lapangan"
                className="flex items-center space-x-2 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-sm transition border border-white/10"
              >
                <Smartphone className="w-4 h-4 text-brand-gold-400" />
                <span>Mode Catat & Tagih Lapangan</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border border-slate-200/80 shadow-xs rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Sambungan
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total} SR</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Periode Aktif: <strong>Oktober 2026</strong>
            </p>
          </Card>

          <Card className="p-4 bg-white border border-slate-200/80 shadow-xs rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Sudah Terbayar (Lunas)
                </p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {stats.paid} <span className="text-sm font-semibold text-slate-500">/ {stats.total}</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>Rp {stats.paidAmount.toLocaleString("id-ID")}</span>
              <span className="font-bold text-emerald-600">{stats.collectionRate}% Efisiensi</span>
            </div>
          </Card>

          <Card className="p-4 bg-white border border-slate-200/80 shadow-xs rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Belum Lunas (Tertagih)
                </p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">
                  {stats.unpaid} <span className="text-sm font-semibold text-slate-500">SR</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-rose-600 font-bold mt-2">
              Rp {stats.unpaidAmount.toLocaleString("id-ID")} tertunggak
            </p>
          </Card>

          <Card className="p-4 bg-white border border-slate-200/80 shadow-xs rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Target Kontak WhatsApp
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {stats.withPhone} <span className="text-sm font-semibold text-slate-500">siap broadcast</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {stats.total - stats.withPhone > 0
                ? `${stats.total - stats.withPhone} warga belum input nomor`
                : "Semua warga telah memiliki nomor"}
            </p>
          </Card>
        </div>

        {/* Message Format Info Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-900 font-extrabold text-xs sm:text-sm">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Format Pesan Otomatis Pengingat WhatsApp Resmi:</span>
            </div>
            <div className="font-mono text-xs bg-white/90 p-3 rounded-xl border border-emerald-200 text-slate-800 shadow-xs">
              &quot;Yth. Bpk/Ibu [Nama], tagihan air bersih KPSPAMS Lemo Baru periode Oktober 2026 sebesar Rp 10.000,- telah terbit. Jatuh tempo: 20 Oktober. Cek rincian di: sikpspams-kuajang.pages.dev/portal?sr=[NoSR]&quot;
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBroadcastOpen(true)}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Mulai Broadcast Sekarang</span>
          </button>
        </div>

        {/* Filter and Table Section */}
        <Card className="p-5 bg-white border border-slate-200/90 shadow-sm rounded-3xl space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama warga, nomor SR, atau dusun..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold-400 focus:bg-white transition"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Dusun Filter */}
              <div className="flex items-center space-x-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterDusun}
                  onChange={(e) => setFilterDusun(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-gold-400"
                >
                  <option value="ALL">Semua Dusun ({filteredByTenant.length})</option>
                  {dusunList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterStatus("ALL")}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterStatus === "ALL"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Semua ({filteredByTenant.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("UNPAID")}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterStatus === "UNPAID"
                      ? "bg-white text-rose-700 shadow-xs"
                      : "text-slate-500 hover:text-rose-700"
                  }`}
                >
                  Belum ({stats.unpaid})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("PAID")}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterStatus === "PAID"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-emerald-700"
                  }`}
                >
                  Lunas ({stats.paid})
                </button>
              </div>

              {/* Reload Button */}
              <button
                type="button"
                onClick={fetchData}
                disabled={isLoading}
                title="Muat ulang data"
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand-gold-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. SR</th>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Dusun / Wilayah</th>
                  <th className="py-3 px-4">No. WhatsApp</th>
                  <th className="py-3 px-4 text-right">Stand Meter</th>
                  <th className="py-3 px-4 text-right">Tagihan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi Pengingat WA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      Tidak ada data pelanggan yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  tableData.map((c) => {
                    const isPaid = c.billingStatus === "PAID";
                    const isCopied = copiedId === c.id;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition group">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {c.connectionNo}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-400">{c.meterSerial}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                            {c.dusun}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {c.phone ? (
                            <span className="text-emerald-700 font-semibold">{c.phone}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">(Belum ada)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                          {c.lastReading.toFixed(2)} m³
                        </td>
                        <td className="py-3 px-4 text-right font-black font-tabular text-slate-900">
                          Rp 10.000,-
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={isPaid ? "success" : "danger"}
                            size="sm"
                            className="font-bold text-[10px]"
                          >
                            {isPaid ? "✓ Lunas" : "● Belum Bayar"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {c.phone ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSendWa(c)}
                                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition active:scale-95"
                                  title="Buka WhatsApp & Kirim Pesan Personal"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-200" />
                                  <span>Kirim WA</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(c)}
                                  className={`p-1.5 rounded-lg border text-xs transition ${
                                    isCopied
                                      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                      : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                                  }`}
                                  title="Salin Teks Pesan ke Clipboard"
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsBroadcastOpen(true)}
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold"
                              >
                                + Input WA
                              </button>
                            )}

                            <Link
                              href="/dashboard/penagihan-lapangan"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                              title="Buka di Mode Catat Lapangan"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
            <span>
              Menampilkan <strong>{tableData.length}</strong> dari <strong>{filteredByTenant.length}</strong> pelanggan
            </span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Lunas: {stats.paid}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Belum: {stats.unpaid}</span>
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal Broadcast WhatsApp Massal Tagihan */}
      <WaBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        customers={broadcastList}
        defaultKpspamsName={user?.kpspamsName || "KPSPAMS Lemo Baru"}
        defaultPeriodName="Oktober 2026"
        defaultDueDate="20 Oktober 2026"
      />
    </DashboardLayout>
  );
}
