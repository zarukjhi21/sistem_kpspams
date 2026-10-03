"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DEMO_CUSTOMERS, DemoCustomer, calculateWaterBill } from "@/lib/demo-data";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

const mapApiCustomerToDemo = (item: any): DemoCustomer => {
  const primaryConn = item.connections?.[0];
  return {
    id: item.id,
    connectionNo: primaryConn?.connection_no || primaryConn?.connection_number || item.code || `SR-${item.id}`,
    name: item.full_name || item.name,
    nik: item.nik || "",
    birthPlaceDate: item.birth_place_date,
    gender: item.gender,
    address: item.identity_address || item.address,
    rtRw: item.rt_rw,
    village: item.village || "KUAJANG",
    district: item.district || "BINUANG",
    religion: item.religion,
    maritalStatus: item.marital_status,
    occupation: item.occupation,
    phone: item.phone,
    dusun: primaryConn?.dusun?.name || item.dusun || "Lemo Baru",
    kpspamsId: item.kpspams_id || item.kpspams?.id || 1,
    kpspamsName: item.kpspams?.name || (item.kpspams_id === 1 ? "KPSPAMS Lemo Baru" : `KPSPAMS Unit ${item.kpspams_id}`),
    meterSerial: primaryConn?.meter?.serial_number || item.meter_serial || "MTR-1001",
    lastReading: primaryConn?.meter?.current_reading !== undefined ? Number(primaryConn.meter.current_reading) : (primaryConn?.meter?.initial_reading !== undefined ? Number(primaryConn.meter.initial_reading) : (item.lastReading ?? 0)),
    status: (item.status === "ACTIVE" ? "ACTIVE" : item.status === "SEALED" ? "SEALED" : "DISCONNECTED") as any,
    tariffType: item.customer_type?.name || "Rumah Tangga",
    latitude: primaryConn?.latitude ? Number(primaryConn.latitude) : -3.4215,
    longitude: primaryConn?.longitude ? Number(primaryConn.longitude) : 119.3452,
    billingStatus: item.billing_status || "UNPAID",
    ktpPhotoUrl: item.ktp_photo_path,
  };
};
import {
  Camera,
  Share2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  Building2,
  MapPin,
  Clock,
  Phone,
  DollarSign,
  User,
  Search,
  Activity,
  Plus,
  Sparkles,
  Info,
  Shield,
  Lock,
  AlertTriangle,
  Map,
  List,
  Mountain,
  Zap,
} from "lucide-react";

const GisBillingRouteMap = dynamic(
  () => import("@/components/gis/GisBillingRouteMap").then((m) => m.GisBillingRouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[460px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 text-xs space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-gold-500 border-t-transparent animate-spin" />
        <span className="animate-pulse font-medium">Memuat Peta Satelit Rute Penagihan GIS Desa Kuajang...</span>
      </div>
    ),
  }
);

export default function PenagihanLapanganPage() {
  return (
    <DashboardLayout>
      <PenagihanLapanganContent />
    </DashboardLayout>
  );
}

function PenagihanLapanganContent() {
  const { user, activeKpspamsId, isDesaLevel } = useAuth();

  // Wizard Step:
  // 1 = Pilih Rumah Pelanggan
  // 2 = Catat Meteran & Hitung Tagihan
  // 3 = Terima Pembayaran Tunai
  // 4 = Kirim Struk Otomatis via WhatsApp (Tanpa Cetak Fisik)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Mode Tampilan Step 1: Peta GIS Rute vs Daftar Antrean Warga (Default: List agar render instan tanpa loading spinner GIS)
  const [viewMode, setViewMode] = useState<"map" | "list">("list");

  // State Pelanggan (mendukung perubahan dinamis status lunas realtime & sinkronisasi data riil)
  const [customers, setCustomers] = useState<DemoCustomer[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kpspams_customers");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && !parsed.some((c: any) => c.name === "Baharuddin S." || c.connectionNo === "SR-LMB-00005")) {
            return parsed;
          }
        } catch {
          // fallback
        }
      }
    }
    return DEMO_CUSTOMERS;
  });

  // Simpan data invoice aktif per sambungan agar bisa langsung dilunasi di backend
  const [unpaidInvoices, setUnpaidInvoices] = useState<Record<string, any>>({});
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchCustomersAndInvoices = async () => {
    try {
      const custRes = await apiClient("/customers?per_page=100");
      if (custRes?.status === "success" && Array.isArray(custRes.data) && custRes.data.length > 0) {
        const mapped = custRes.data.map(mapApiCustomerToDemo);
        setCustomers(mapped);
      }
    } catch (err) {
      console.warn("Gagal fetch pelanggan dari server:", err);
    }

    try {
      const invRes = await apiClient("/invoices?status=UNPAID&per_page=100");
      if (invRes?.status === "success" && Array.isArray(invRes.data)) {
        const invMap: Record<string, any> = {};
        invRes.data.forEach((inv: any) => {
          const connNo = inv.connection?.connection_no || inv.connection?.connection_number;
          if (connNo) {
            invMap[connNo] = inv;
          }
        });
        setUnpaidInvoices(invMap);
      }
    } catch (err) {
      console.warn("Gagal fetch invoices:", err);
    }
  };

  React.useEffect(() => {
    fetchCustomersAndInvoices();
  }, [activeKpspamsId]);

  // Multi-tenant Isolation: Petugas Lapangan terisolasi secara ketat ke KPSPAMS miliknya
  const effectiveKpspamsId = !isDesaLevel && user?.kpspamsId ? user.kpspamsId : activeKpspamsId;

  // Filter pelanggan berdasarkan KPSPAMS efektif (Petugas dusun lain tidak bisa diakses)
  const availableCustomers =
    effectiveKpspamsId === null
      ? customers
      : customers.filter((c) => c.kpspamsId === effectiveKpspamsId);

  // Step 1: Pemilihan Pelanggan
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(
    availableCustomers[0]?.id || 1
  );

  const selectedCustomer: DemoCustomer =
    availableCustomers.find((c) => c.id === selectedCustomerId) ||
    availableCustomers[0] ||
    DEMO_CUSTOMERS[0];

  // Pastikan ID pelanggan terpilih sinkron jika petugas berpindah persona/wilayah
  React.useEffect(() => {
    if (availableCustomers.length > 0 && !availableCustomers.some((c) => c.id === selectedCustomerId)) {
      setSelectedCustomerId(availableCustomers[0].id);
      setCurrentReading((availableCustomers[0].lastReading + 14.5).toFixed(2));
      setCustomerPhone(availableCustomers[0].phone || "");
    }
  }, [effectiveKpspamsId, availableCustomers, selectedCustomerId]);

  // Step 2: Pencatatan Meteran
  const [currentReading, setCurrentReading] = useState<string>(
    (selectedCustomer.lastReading + 14.5).toFixed(2)
  );

  // Step 3: Pembayaran Tunai
  const [tenderAmount, setTenderAmount] = useState<number>(10000);

  // Step 4: Struk & WhatsApp State
  const [generatedReceiptNo, setGeneratedReceiptNo] = useState<string>("");
  const [transactionTime, setTransactionTime] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>(
    selectedCustomer?.phone || ""
  );

  // Sinkronkan nomor WhatsApp otomatis setiap kali warga yang dipilih berganti
  React.useEffect(() => {
    if (selectedCustomer) {
      setCustomerPhone(selectedCustomer.phone || "");
    }
  }, [selectedCustomerId, selectedCustomer]);

  // Kalkulasi Kubikasi & Tagihan Otomatis
  const previousReading = selectedCustomer.lastReading;
  const currentNum = parseFloat(currentReading) || 0;
  const usageM3 = Math.max(0, currentNum - previousReading);
  const billCalc = calculateWaterBill(selectedCustomer.kpspamsId, usageM3);
  const totalDue = billCalc.totalAmount;
  const changeDue = Math.max(0, tenderAmount - totalDue);

  // Handler Pilih Pelanggan Baru
  const handleSelectCustomer = (cust: DemoCustomer) => {
    setSelectedCustomerId(cust.id);
    // Beri default stand baru +14.5 m3 di atas stand lama
    setCurrentReading((cust.lastReading + 14.5).toFixed(2));
    setCustomerPhone(cust.phone || "");
  };

  // Step 1 -> Step 2
  const handleProceedToMeter = () => {
    if (selectedCustomer?.phone) {
      setCustomerPhone(selectedCustomer.phone);
    }
    setCurrentStep(2);
  };

  // Update nomor WhatsApp warga dan simpan otomatis ke storage
  const handlePhoneChange = (newVal: string) => {
    setCustomerPhone(newVal);
    selectedCustomer.phone = newVal;
    const updated = customers.map((c) =>
      c.id === selectedCustomer.id ? { ...c, phone: newVal } : c
    );
    setCustomers(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("kpspams_customers", JSON.stringify(updated));
    }
  };

  // Step 2 -> Step 3
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setTenderAmount(totalDue); // Default ke uang pas
    setCurrentStep(3);
  };

  // Step 3 -> Step 4 (Konfirmasi Lunas & Buka WhatsApp)
  const handleConfirmPayment = async () => {
    setIsSubmittingPayment(true);

    let receiptNo = `KW/202610/KP0${selectedCustomer.kpspamsId}/${Math.floor(1000 + Math.random() * 9000)}`;
    const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WITA";
    setTransactionTime(nowTime);

    // Cari data invoice aktif untuk sambungan ini
    const activeInvoice = unpaidInvoices[selectedCustomer.connectionNo];
    const invoiceId = activeInvoice?.id;
    const connectionId = activeInvoice?.connection_id || selectedCustomer.id;
    const billingPeriodId = activeInvoice?.billing_period_id;

    // Petakan Akun Kas Tunai Resmi KPSPAMS
    // KPSPAMS 1 (Lemo Baru) -> ID: 1 (Kas Tunai Bendahara Lemo Baru)
    // KPSPAMS 2 (Lemo Tua) -> ID: 3 (Kas Tunai Bendahara Lemo Tua)
    // KPSPAMS 3 (Sarampu 1) -> ID: 5 (Kas Tunai Bendahara Sarampu 1)
    const cashAccountMapping: Record<number, number> = {
      1: 1,
      2: 3,
      3: 5,
    };
    const cashAccountId = cashAccountMapping[selectedCustomer.kpspamsId] || 1;

    try {
      // 1. Eksekusi Pembayaran Kasir Atomik ke Backend API (Database SQLite)
      if (invoiceId) {
        const paymentPayload = {
          invoice_id: invoiceId,
          cash_account_id: cashAccountId,
          amount_paid: totalDue,
          payment_method: "CASH",
          reference_number: `FIELD-${Date.now().toString().slice(-6)}`,
        };

        const payRes = await apiClient("/payments", {
          method: "POST",
          body: JSON.stringify(paymentPayload),
        });

        if (payRes?.status === "success" && payRes.data?.receipt_number) {
          receiptNo = payRes.data.receipt_number;
        }
      }

      // 2. Rekam Pembacaan Stand Meter Air Resmi ke Backend API
      if (connectionId && billingPeriodId) {
        try {
          await apiClient("/meter-readings", {
            method: "POST",
            body: JSON.stringify({
              connection_id: connectionId,
              billing_period_id: billingPeriodId,
              current_reading: currentNum,
              reading_date: new Date().toISOString().split("T")[0],
              notes: `Dicatat tunai di tempat oleh ${user?.name || "Petugas Lapangan"}`,
            }),
          });
        } catch {
          // Pembacaan meter mungkin sudah ada pada periode berjalan
        }
      }
    } catch (apiErr: any) {
      console.warn("Gagal memproses transaksi kasir di server, menggunakan fallback:", apiErr);
    } finally {
      setIsSubmittingPayment(false);
    }

    setGeneratedReceiptNo(receiptNo);

    // Update stand meter, phone & status tagihan Lunas secara realtime
    selectedCustomer.lastReading = currentNum;
    selectedCustomer.billingStatus = "PAID";
    selectedCustomer.phone = customerPhone;
    const updatedCustList = customers.map((c) =>
      c.id === selectedCustomer.id
        ? { ...c, lastReading: currentNum, billingStatus: "PAID" as const, phone: customerPhone }
        : c
    );
    setCustomers(updatedCustList);

    // Simpan ke persistent storage dan catat mutasi kas masuk ke Buku Kas Resmi KPSPAMS
    if (typeof window !== "undefined") {
      localStorage.setItem("kpspams_customers", JSON.stringify(updatedCustList));

      try {
        const existingTxStr = localStorage.getItem("kpspams_cash_transactions");
        let txList = [];
        if (existingTxStr) {
          txList = JSON.parse(existingTxStr);
        }
        const newTx = {
          id: Date.now(),
          kpspamsId: selectedCustomer.kpspamsId,
          kpspamsName: selectedCustomer.kpspamsName,
          txNumber: receiptNo,
          date: new Date().toISOString().split("T")[0],
          type: "INCOME" as const,
          category: "AIR_PAYMENT",
          amount: totalDue,
          description: `Penerimaan tagihan air tunai di tempat - ${selectedCustomer.name} (${selectedCustomer.connectionNo})`,
          accountName: `Kas Operasional Tunai ${selectedCustomer.kpspamsName.replace("KPSPAMS ", "")}`,
        };
        txList.unshift(newTx);
        localStorage.setItem("kpspams_cash_transactions", JSON.stringify(txList));

        // Update saldo kas tunai KPSPAMS di localStorage
        const existingAccStr = localStorage.getItem("kpspams_cash_accounts");
        if (existingAccStr) {
          let accList = JSON.parse(existingAccStr);
          accList = accList.map((a: { kpspamsId: number; bankName: string; currentBalance: number }) => {
            if (a.kpspamsId === selectedCustomer.kpspamsId && a.bankName === "Kasir Tunai") {
              return { ...a, currentBalance: a.currentBalance + totalDue };
            }
            return a;
          });
          localStorage.setItem("kpspams_cash_accounts", JSON.stringify(accList));
        }
      } catch (err) {
        console.error("Gagal sinkronisasi buku kas:", err);
      }
    }

    setCurrentStep(4);
  };

  // Kembali ke Step 1 untuk rumah berikutnya
  const handleNextHouse = () => {
    const nextIdx = availableCustomers.findIndex((c) => c.id === selectedCustomerId) + 1;
    if (nextIdx < availableCustomers.length) {
      handleSelectCustomer(availableCustomers[nextIdx]);
    }
    setCurrentStep(1);
  };

  // Teks Resmi Kwitansi WhatsApp SI-KPSPAMS
  const getWhatsAppMessage = () => {
    return encodeURIComponent(
      `*KWITANSI PEMBAYARAN AIR BERSIH RESMI*\n` +
      `*SI-KPSPAMS KUAJANG*\n` +
      `Unit: ${selectedCustomer.kpspamsName} (Desa Kuajang)\n` +
      `----------------------------------------\n` +
      `No. Kwitansi  : ${generatedReceiptNo}\n` +
      `No. Sambungan : ${selectedCustomer.connectionNo}\n` +
      `Nama Warga    : ${selectedCustomer.name}\n` +
      `Wilayah       : ${selectedCustomer.dusun}\n` +
      `Periode       : Oktober 2026\n` +
      `Stand Lalu    : ${previousReading.toFixed(2)} m³\n` +
      `Stand Kini    : ${currentNum.toFixed(2)} m³\n` +
      `Pemakaian Air : ${usageM3.toFixed(2)} m³\n` +
      `Rincian Tarif : ${billCalc.formulaDescription}\n` +
      `Total Bayar   : Rp ${totalDue.toLocaleString("id-ID")},-\n` +
      `Uang Diterima : Rp ${tenderAmount.toLocaleString("id-ID")},-\n` +
      `Kembalian     : Rp ${changeDue.toLocaleString("id-ID")},-\n` +
      `Status        : *LUNAS* (Diterima Tunai Petugas di Tempat)\n` +
      `Petugas Kasir : ${user?.name || "Petugas Lapangan"}\n` +
      `Waktu Transaksi: ${transactionTime}\n` +
      `----------------------------------------\n` +
      `Terima kasih telah berpartisipasi menjaga kelestarian & operasional air bersih Desa Kuajang.\n` +
      `_Pesan ini merupakan bukti pembayaran digital sah yang tercatat di Buku Kas Resmi._`
    );
  };

  const cleanPhone = customerPhone.replace(/^0/, "62").replace(/\D/g, "");
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone || "6281234567890"}&text=${getWhatsAppMessage()}`;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-3xl mx-auto pb-36 md:pb-12">
      {/* Top Banner Mode Lapangan */}
      <div className="bg-gradient-to-r from-brand-maroon-900 via-slate-900 to-black text-white p-5 rounded-3xl shadow-xl border border-brand-maroon-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-gold-400">
              Operasional Petugas Lapangan
            </span>
          </div>
          <Badge variant="brand" size="sm">
            {selectedCustomer.kpspamsName}
          </Badge>
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1.5">
          Catat Meter & Penagihan di Tempat
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Kunjungi rumah warga &rarr; Catat meteran air &rarr; Hitung tagihan otomatis &rarr; Terima uang tunai &rarr; Kirim struk instan ke WhatsApp warga.
        </p>

        {/* Stepper Progress */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-4 mt-2 border-t border-slate-800 text-center text-xs">
          <div
            className={`p-1.5 sm:p-2 rounded-xl border ${
              currentStep >= 1
                ? "bg-brand-maroon-800/80 border-brand-gold-500/80 text-white font-bold"
                : "bg-slate-800/40 border-slate-700 text-slate-500"
            }`}
          >
            <span className="block text-[9px] sm:text-[10px] opacity-75">1. Rumah</span>
            <span className="truncate block text-[11px] sm:text-xs">Pilih Warga</span>
          </div>
          <div
            className={`p-1.5 sm:p-2 rounded-xl border ${
              currentStep >= 2
                ? "bg-brand-maroon-800/80 border-brand-gold-500/80 text-white font-bold"
                : "bg-slate-800/40 border-slate-700 text-slate-500"
            }`}
          >
            <span className="block text-[9px] sm:text-[10px] opacity-75">2. Meter</span>
            <span className="truncate block text-[11px] sm:text-xs">Catat & Tarif</span>
          </div>
          <div
            className={`p-1.5 sm:p-2 rounded-xl border ${
              currentStep >= 3
                ? "bg-brand-maroon-800/80 border-brand-gold-500/80 text-white font-bold"
                : "bg-slate-800/40 border-slate-700 text-slate-500"
            }`}
          >
            <span className="block text-[9px] sm:text-[10px] opacity-75">3. Bayar</span>
            <span className="truncate block text-[11px] sm:text-xs">Terima Tunai</span>
          </div>
          <div
            className={`p-1.5 sm:p-2 rounded-xl border ${
              currentStep >= 4
                ? "bg-brand-maroon-800/80 border-brand-gold-500/80 text-white font-bold"
                : "bg-slate-800/40 border-slate-700 text-slate-500"
            }`}
          >
            <span className="block text-[9px] sm:text-[10px] opacity-75">4. Struk WA</span>
            <span className="truncate block text-[11px] sm:text-xs">Kirim Struk</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LANGKAH 1: PILIH RUMAH PELANGGAN / ANTREAN RUTE                            */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader
            title="Langkah 1: Pilih Rumah Pelanggan yang Dikunjungi"
            subtitle="Pilih dari daftar rute antrean atau cari berdasarkan nama / nomor sambungan"
          />

          <div className="space-y-4">
            {/* Field Officer Territory Lock Indicator */}
            {!isDesaLevel && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2.5">
                  <Shield className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Wilayah Penugasan: {user?.kpspamsName}</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Daftar rute kunjungan dibatasi khusus untuk warga di wilayah tugas Anda. Anda tidak dapat mengakses atau menagih warga di dusun lain.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-amber-200/80 text-amber-900 font-bold text-[10px] flex items-center space-x-1 flex-shrink-0">
                  <Lock className="w-3 h-3" />
                  <span>Dusun Terisolasi</span>
                </span>
              </div>
            )}

            {/* View Mode Toggle: Peta GIS Rute vs Daftar Antrean */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-1">
              <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start">
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    viewMode === "map"
                      ? "bg-brand-maroon-800 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Peta GIS Rute</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      viewMode === "map"
                        ? "bg-brand-gold-400 text-brand-maroon-950"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    GPS
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    viewMode === "list"
                      ? "bg-brand-maroon-800 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Daftar Antrean</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      viewMode === "list"
                        ? "bg-brand-gold-400 text-brand-maroon-950"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {availableCustomers.length}
                  </span>
                </button>
              </div>

              {/* Status Tagihan Summary */}
              <div className="flex items-center space-x-3 text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
                <div className="flex items-center space-x-1.5 text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>
                    Belum Bayar:{" "}
                    {availableCustomers.filter((c) => c.billingStatus !== "PAID").length}
                  </span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center space-x-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>
                    Lunas:{" "}
                    {availableCustomers.filter((c) => c.billingStatus === "PAID").length}
                  </span>
                </div>
              </div>
            </div>

            {/* PETA GIS RUTE ATAU DAFTAR ANTREAN */}
            {viewMode === "map" ? (
              <div className="space-y-2">
                <GisBillingRouteMap
                  customers={availableCustomers}
                  selectedCustomerId={selectedCustomerId}
                  onSelectCustomer={(cust) => handleSelectCustomer(cust)}
                  onProceedToRecord={(cust) => {
                    handleSelectCustomer(cust);
                    handleProceedToMeter();
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Quick Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Cari nama warga, dusun, atau No. SR..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-maroon-700 focus:outline-none"
                  />
                </div>

                {/* Customer List Selector */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableCustomers
                    .filter(
                      (c) =>
                        !searchQuery ||
                        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.connectionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.dusun.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((cust) => {
                      const isSelected = cust.id === selectedCustomerId;
                      const isPaid = cust.billingStatus === "PAID";
                      return (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? "bg-brand-maroon-50/80 border-brand-maroon-700 ring-2 ring-brand-maroon-600/30"
                              : "bg-white hover:bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                isSelected
                                  ? "bg-brand-maroon-800 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {cust.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-black text-slate-900">
                                  {cust.name}
                                </span>
                                <Badge
                                  variant={isPaid ? "success" : "danger"}
                                  size="sm"
                                  className="text-[9px] px-1.5 py-0"
                                >
                                  {isPaid ? "✓ Lunas" : "● Belum"}
                                </Badge>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {cust.connectionNo} • {cust.dusun}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-black font-tabular text-slate-800">
                              {cust.lastReading.toFixed(2)} m³
                            </div>
                            <div className="text-[10px] text-slate-400">Stand lalu</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Selected Customer Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-gold-400">
                    Rumah Pelanggan Terpilih
                  </span>
                  <Badge
                    variant={selectedCustomer.billingStatus === "PAID" ? "success" : "danger"}
                    size="sm"
                    className="whitespace-nowrap font-bold"
                  >
                    {selectedCustomer.billingStatus === "PAID" ? "✓ Lunas" : "● Belum Bayar"}
                  </Badge>
                </div>
                <Badge variant="brand" size="sm" className="whitespace-nowrap font-mono font-bold">
                  {selectedCustomer.connectionNo}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Nama Pelanggan</div>
                  <div className="font-bold text-white text-sm">{selectedCustomer.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Wilayah / Dusun</div>
                  <div className="font-bold text-white">{selectedCustomer.dusun}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Nomor Seri Meter</div>
                  <div className="font-mono text-amber-300 font-bold">
                    {selectedCustomer.meterSerial}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Stand Bulan Lalu</div>
                  <div className="font-mono text-emerald-400 font-bold">
                    {previousReading.toFixed(2)} m³
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">No. WhatsApp Warga</div>
                  <div className="font-mono text-emerald-400 font-bold flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>{selectedCustomer.phone || "(Belum ada WA)"}</span>
                  </div>
                </div>
                {selectedCustomer.latitude && selectedCustomer.longitude && (
                  <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-brand-gold-400" />
                      <span>Koordinat GPS:</span>
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${selectedCustomer.latitude},${selectedCustomer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-gold-400 hover:underline font-mono text-[10px]"
                    >
                      {selectedCustomer.latitude.toFixed(5)}, {selectedCustomer.longitude.toFixed(5)} (Google Maps ↗)
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Proceed to Meter */}
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-lg py-3.5 text-sm"
                onClick={handleProceedToMeter}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Lanjut: Catat Meteran Air di Rumah Warga &rarr;
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* LANGKAH 2: CATAT METERAN & HITUNG TAGIHAN OTOMATIS                          */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader
            title="Langkah 2: Catat Stand Meteran & Hitung Tagihan"
            subtitle={`Warga: ${selectedCustomer.name} (${selectedCustomer.connectionNo})`}
          />

          <form onSubmit={handleProceedToPayment} className="space-y-4">
            {/* Input Stand Meter Angka */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Stand Lalu (Awal):</span>
                <div className="text-xl font-black font-tabular text-slate-700 mt-1">
                  {previousReading.toFixed(2)} m³
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Stand Meter Terbaca Saat Ini (m³) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={currentReading}
                    onChange={(e) => setCurrentReading(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xl font-black font-tabular border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-maroon-700"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">m³</span>
                </div>
              </div>
            </div>

            {/* Kotak Kalkulasi Tagihan Sesuai Sistem Air (Gravitasi vs Sumur Bor) */}
            <div className={`p-5 rounded-2xl border-2 space-y-2.5 ${
              selectedCustomer.kpspamsId === 1
                ? "bg-gradient-to-br from-brand-maroon-50 via-white to-emerald-50/60 border-brand-maroon-300"
                : "bg-gradient-to-br from-blue-50 via-white to-amber-50/60 border-blue-300"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 block">
                    Perhitungan Pemakaian & Tagihan Warga
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {billCalc.systemLabel}
                  </span>
                </div>
                {selectedCustomer.kpspamsId === 1 ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center space-x-1.5 w-fit shadow-sm">
                    <Mountain className="w-3.5 h-3.5 text-emerald-700 stroke-[2.3]" />
                    <span>Sistem Gravitasi Alami (0% Beban Listrik)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2.5 py-1 rounded-full flex items-center space-x-1.5 w-fit shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-amber-600 stroke-[2.3]" />
                    <span>Sumur Bor (Pompa Submersible Listrik)</span>
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Kubikasi Pemakaian Air:</span>
                  <span className="font-tabular font-bold text-emerald-800 text-sm">
                    {usageM3.toFixed(2)} m³
                  </span>
                </div>

                {selectedCustomer.kpspamsId === 1 ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Paket Beban Dasar (s.d 15 m³):</span>
                      <span className="font-tabular font-bold">Rp 10.000</span>
                    </div>
                    {billCalc.excessM3 > 0 ? (
                      <div className="flex justify-between text-amber-900 font-medium">
                        <span>Kelebihan ({billCalc.excessM3.toFixed(2)} m³ × Rp 1.000):</span>
                        <span className="font-tabular font-bold">Rp {billCalc.excessFee.toLocaleString("id-ID")}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-emerald-700 text-[11px]">
                        <span>Kelebihan di atas 15 m³:</span>
                        <span>Rp 0 (Termasuk paket dasar)</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Biaya Abonemen Pemeliharaan:</span>
                      <span className="font-tabular font-bold">Rp 7.500</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Tarif Air ({usageM3.toFixed(2)} m³ × Rp 2.000):</span>
                      <span className="font-tabular font-bold">Rp {(usageM3 * 2000).toLocaleString("id-ID")}</span>
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-extrabold text-slate-900 text-xs">TOTAL YANG HARUS DIBAYAR:</span>
                  <span className="font-black text-brand-maroon-900 text-xl font-tabular">
                    Rp {totalDue.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 italic flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{billCalc.electricityNote}</span>
              </div>
            </div>

            {/* Input No HP / WhatsApp Pelanggan untuk Pengiriman Struk */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  No. WhatsApp Warga (Untuk Mengirim Struk Digital) <span className="text-rose-500">*</span>
                </label>
                {selectedCustomer.phone && customerPhone === selectedCustomer.phone && (
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1 animate-in fade-in duration-150">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Terisi Otomatis dari Data Pelanggan</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-emerald-300 bg-emerald-50/40 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Nomor ini terisi otomatis dari data pendaftaran pelanggan. Jika warga berganti nomor, ubah di sini dan data akan otomatis diperbarui.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCurrentStep(1)}
              >
                &larr; Ganti Warga
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="font-bold shadow-lg"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Lanjut: Terima Pembayaran Tunai &rarr;
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* LANGKAH 3: TERIMA PEMBAYARAN TUNAI DI TEMPAT                               */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <Card className="animate-in fade-in duration-150">
          <CardHeader
            title="Langkah 3: Penerimaan Pembayaran Tunai"
            subtitle={`Tagihkan ke warga: ${selectedCustomer.name} (${selectedCustomer.connectionNo})`}
          />

          <div className="space-y-4">
            {/* Total Due Big Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-maroon-900 via-slate-900 to-black text-white text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                Total Tagihan Harus Dibayar Warga:
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white font-tabular">
                Rp {totalDue.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-300">
                Pemakaian: <strong>{usageM3.toFixed(2)} m³</strong> • ({billCalc.formulaDescription})
              </p>
            </div>

            {/* Input Uang Tunai Diterima */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Uang Tunai Diterima dari Warga:
              </label>

              <div className="grid grid-cols-4 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setTenderAmount(totalDue)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    tenderAmount === totalDue
                      ? "bg-brand-maroon-800 text-white border-brand-maroon-800 shadow-sm"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  onClick={() => setTenderAmount(20000)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    tenderAmount === 20000
                      ? "bg-brand-maroon-800 text-white border-brand-maroon-800 shadow-sm"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  Rp 20.000
                </button>
                <button
                  type="button"
                  onClick={() => setTenderAmount(50000)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    tenderAmount === 50000
                      ? "bg-brand-maroon-800 text-white border-brand-maroon-800 shadow-sm"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  Rp 50.000
                </button>
                <button
                  type="button"
                  onClick={() => setTenderAmount(100000)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    tenderAmount === 100000
                      ? "bg-brand-maroon-800 text-white border-brand-maroon-800 shadow-sm"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  Rp 100.000
                </button>
              </div>

              <input
                type="number"
                value={tenderAmount || ""}
                onChange={(e) => setTenderAmount(Number(e.target.value))}
                placeholder="Masukkan nominal uang tunai..."
                className="w-full px-3.5 py-3 text-lg font-black font-tabular border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-maroon-700"
              />
            </div>

            {/* Tampilan Kembalian */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-emerald-800 font-bold uppercase">Uang Kembalian Warga:</div>
                <div className="text-xl font-black font-tabular text-emerald-900 mt-0.5">
                  Rp {changeDue.toLocaleString("id-ID")}
                </div>
              </div>
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCurrentStep(2)}
              >
                &larr; Koreksi Stand Meter
              </Button>
              <Button
                type="button"
                variant="gold"
                size="lg"
                className="font-bold shadow-lg"
                onClick={handleConfirmPayment}
                icon={<Check className="w-4 h-4" />}
              >
                Konfirmasi Lunas & Kirim Struk WA
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* LANGKAH 4: KIRIM STRUK OTOMATIS KE WHATSAPP (TANPA FITUR CETAK FISIK)       */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-in zoom-in-95 duration-150">
          {/* Success Banner */}
          <div className="p-4 rounded-3xl bg-emerald-600 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-sm">Pembayaran Lunas & Tercatat di Buku Kas!</div>
                <div className="text-xs text-emerald-100">
                  Kwitansi {generatedReceiptNo} telah diterbitkan untuk {selectedCustomer.name}.
                </div>
              </div>
            </div>
            <Badge variant="brand" size="sm">LUNAS</Badge>
          </div>

          {/* Struk Kwitansi Digital (Pratinjau Layar) */}
          <Card className="max-w-md mx-auto p-5 sm:p-6 border border-slate-300 shadow-xl font-mono text-xs">
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-300 space-y-1">
              <div className="w-12 h-12 mx-auto rounded-xl overflow-hidden border border-brand-gold-500/50 shadow-sm bg-slate-950 flex items-center justify-center mb-1">
                <Image
                  src="/logo.jpg"
                  alt="Logo SI-KPSPAMS Kuajang"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="font-extrabold text-sm text-brand-maroon-900">SI-KPSPAMS KUAJANG</div>
              <div className="text-[10px] text-slate-500">Unit: {selectedCustomer.kpspamsName}</div>
              <div className="text-[10px] text-slate-400">Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar</div>
              <div className="mt-2 inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                {generatedReceiptNo}
              </div>
            </div>

            <div className="py-4 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Sambungan:</span>
                <span className="font-bold text-slate-900">{selectedCustomer.connectionNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Wilayah / Dusun:</span>
                <span>{selectedCustomer.dusun}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stand Meter:</span>
                <span className="font-bold">{previousReading.toFixed(2)} &rarr; {currentNum.toFixed(2)} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pemakaian:</span>
                <span className="font-bold text-emerald-700">{usageM3.toFixed(2)} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rincian Tarif:</span>
                <span className="font-bold text-slate-800 text-right">{billCalc.formulaDescription}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-dashed border-slate-200 font-black text-xs text-slate-900">
                <span>TOTAL LUNAS:</span>
                <span>Rp {totalDue.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Uang Diterima:</span>
                <span>Rp {tenderAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kembalian:</span>
                <span>Rp {changeDue.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-[10px] text-emerald-800 font-bold">
              ✓ LUNAS - DITERIMA PETUGAS DI TEMPAT SECARA TUNAI
            </div>

            <div className="pt-3 text-center text-[9px] text-slate-400">
              Waktu: {transactionTime} • Petugas: {user?.name || "Petugas Lapangan"}
            </div>
          </Card>

          {/* Tombol Utama: Kirim WhatsApp Otomatis Langsung */}
          <div className="space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-900/30 transition flex items-center justify-center space-x-2.5 active:scale-95"
            >
              <Share2 className="w-5 h-5" />
              <span>Kirim Struk ke WhatsApp Pelanggan Sekarang</span>
            </a>

            <div className="text-center text-[11px] text-slate-500">
              Kwitansi digital akan otomatis terkirim ke No. WA: <strong>{customerPhone}</strong>
            </div>

            {/* Tombol Lanjut ke Rumah Warga Berikutnya */}
            <div className="pt-2 text-center">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-xl py-3.5"
                onClick={handleNextHouse}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                ⚡ Selesai! Kunjungi Rumah Warga Berikutnya &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
