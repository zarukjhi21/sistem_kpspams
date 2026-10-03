"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { DEMO_KPSPAMS_LIST } from "@/lib/demo-data";
import { apiClient } from "@/lib/api-client";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  PlusCircle,
  Building2,
  CheckCircle2,
  Search,
  Filter,
  CreditCard,
  History,
  X,
  Sparkles,
  Printer,
  FileText,
  Copy,
  Check,
  Shield,
  Lock,
  AlertTriangle,
  Receipt,
  Smartphone,
  MinusCircle,
  Share2,
} from "lucide-react";

interface CashAccountState {
  id: number;
  kpspamsId: number;
  code: string;
  name: string;
  bankName: string;
  accountNumber: string;
  openingBalance: number;
  currentBalance: number;
}

interface FinancialTx {
  id: number;
  kpspamsId: number;
  kpspamsName: string;
  txNumber: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  description: string;
  accountName: string;
}

const INITIAL_ACCOUNTS: CashAccountState[] = [
  {
    id: 1,
    kpspamsId: 1,
    code: "KAS-LMB-TUNAI",
    name: "Kas Tunai Bendahara Lemo Baru",
    bankName: "Kasir Tunai",
    accountNumber: "-",
    openingBalance: 0,
    currentBalance: 51000,
  },
  {
    id: 2,
    kpspamsId: 1,
    code: "BANK-LMB-BRI",
    name: "Rekening BRI KPSPAMS Lemo Baru",
    bankName: "Bank BRI Unit Binuang",
    accountNumber: "0214-01-002345-53-1",
    openingBalance: 0,
    currentBalance: 0,
  },
  {
    id: 3,
    kpspamsId: 2,
    code: "KAS-LMT-TUNAI",
    name: "Kas Tunai Bendahara Lemo Tua",
    bankName: "Kasir Tunai",
    accountNumber: "-",
    openingBalance: 0,
    currentBalance: 0,
  },
  {
    id: 4,
    kpspamsId: 2,
    code: "BANK-LMT-SULSELBAR",
    name: "Rekening BPD Sulselbar Lemo Tua",
    bankName: "Bank Sulselbar",
    accountNumber: "510-02-004321-7",
    openingBalance: 0,
    currentBalance: 0,
  },
  {
    id: 5,
    kpspamsId: 3,
    code: "KAS-SR1-TUNAI",
    name: "Kas Tunai Sarampu 1 & Pakkandoang",
    bankName: "Kasir Tunai",
    accountNumber: "-",
    openingBalance: 0,
    currentBalance: 0,
  },
  {
    id: 6,
    kpspamsId: 3,
    code: "BANK-SR1-BRI",
    name: "Rekening BRI KPSPAMS Sarampu 1",
    bankName: "Bank BRI",
    accountNumber: "0214-01-007890-53-4",
    openingBalance: 0,
    currentBalance: 0,
  },
];

const INITIAL_TX: FinancialTx[] = [
  {
    id: 5,
    kpspamsId: 1,
    kpspamsName: "KPSPAMS Lemo Baru",
    txNumber: "TX-IN-3F07E23E",
    date: "2026-09-20",
    type: "INCOME",
    category: "AIR_PAYMENT",
    amount: 11000,
    description: "Penerimaan pembayaran air tagihan Periode September 2026",
    accountName: "Kas Tunai Bendahara Lemo Baru",
  },
  {
    id: 4,
    kpspamsId: 1,
    kpspamsName: "KPSPAMS Lemo Baru",
    txNumber: "TX-IN-0DD194FB",
    date: "2026-08-20",
    type: "INCOME",
    category: "AIR_PAYMENT",
    amount: 10000,
    description: "Penerimaan pembayaran air tagihan Periode Agustus 2026",
    accountName: "Kas Tunai Bendahara Lemo Baru",
  },
  {
    id: 3,
    kpspamsId: 1,
    kpspamsName: "KPSPAMS Lemo Baru",
    txNumber: "TX-IN-5080CC11",
    date: "2026-07-20",
    type: "INCOME",
    category: "AIR_PAYMENT",
    amount: 10000,
    description: "Penerimaan pembayaran air tagihan Periode Juli 2026",
    accountName: "Kas Tunai Bendahara Lemo Baru",
  },
  {
    id: 2,
    kpspamsId: 1,
    kpspamsName: "KPSPAMS Lemo Baru",
    txNumber: "TX-IN-CC6C90FF",
    date: "2026-06-20",
    type: "INCOME",
    category: "AIR_PAYMENT",
    amount: 10000,
    description: "Penerimaan pembayaran air tagihan Periode Juni 2026",
    accountName: "Kas Tunai Bendahara Lemo Baru",
  },
  {
    id: 1,
    kpspamsId: 1,
    kpspamsName: "KPSPAMS Lemo Baru",
    txNumber: "TX-IN-C5EE8109",
    date: "2026-05-20",
    type: "INCOME",
    category: "AIR_PAYMENT",
    amount: 10000,
    description: "Penerimaan pembayaran air tagihan Periode Mei 2026",
    accountName: "Kas Tunai Bendahara Lemo Baru",
  },
];

export default function KeuanganPage() {
  return (
    <DashboardLayout>
      <KeuanganContent />
    </DashboardLayout>
  );
}

function KeuanganContent() {
  const { activeKpspamsId, user, isDesaLevel } = useAuth();
  const isPetugasLapangan = user?.role === "petugas_lapangan";
  const effectiveKpspamsId = !isDesaLevel && user?.kpspamsId ? user.kpspamsId : activeKpspamsId;

  // Akun Kas & Bank - Sinkronisasi Langsung ke REST API Server
  const [accounts, setAccounts] = useState<CashAccountState[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<FinancialTx[]>(INITIAL_TX);
  const [isLoadingFinance, setIsLoadingFinance] = useState<boolean>(false);

  const fetchRealFinanceData = async () => {
    setIsLoadingFinance(true);
    try {
      // 1. Ambil Akun Kas Resmi dari Server Backend
      const accRes = await apiClient<{ total_balance: number; accounts: any[] }>("/finance/cash-accounts");
      if (accRes?.status === "success" && accRes.data?.accounts) {
        const mappedAcc: CashAccountState[] = accRes.data.accounts.map((a: any) => ({
          id: a.id,
          kpspamsId: a.kpspams_id,
          code: a.account_code,
          name: a.account_name,
          bankName: a.bank_name || (a.account_number ? "Bank Operasional" : "Kasir Tunai"),
          accountNumber: a.account_number || "-",
          openingBalance: parseFloat(a.opening_balance) || 0,
          currentBalance: parseFloat(a.current_balance) || 0,
        }));
        setAccounts(mappedAcc);
      }

      // 2. Ambil Riwayat Transaksi Mutasi Kas Resmi dari Server Backend
      const txRes = await apiClient<any>("/finance/transactions?per_page=50");
      if (txRes?.status === "success" && Array.isArray(txRes.data)) {
        const mappedTx: FinancialTx[] = txRes.data.map((t: any) => ({
          id: t.id,
          kpspamsId: t.kpspams_id,
          kpspamsName: t.cash_account?.kpspams?.name || (t.kpspams_id === 1 ? "KPSPAMS Lemo Baru" : `KPSPAMS Unit ${t.kpspams_id}`),
          txNumber: t.transaction_number,
          date: t.transaction_date,
          type: t.transaction_type,
          category: t.category,
          amount: parseFloat(t.amount) || 0,
          description: t.description,
          accountName: t.cash_account?.account_name || "Kas Tunai",
        }));
        setTransactions(mappedTx);
      }
    } catch (e) {
      console.warn("Sinkronisasi finance server offline, menggunakan baseline verifikasi:", e);
    } finally {
      setIsLoadingFinance(false);
    }
  };

  useEffect(() => {
    // Bersihkan seluruh cache fiktif lama di browser
    if (typeof window !== "undefined") {
      localStorage.removeItem("kpspams_cash_accounts");
      localStorage.removeItem("kpspams_cash_transactions");
    }
    fetchRealFinanceData();
  }, []);

  // State Modal Saldo Awal
  const [showOpeningModal, setShowOpeningModal] = useState<boolean>(false);
  const [selectedAcc, setSelectedAcc] = useState<CashAccountState | null>(null);
  const [newOpeningBalance, setNewOpeningBalance] = useState<string>("");
  const [openingNotes, setOpeningNotes] = useState<string>("");

  // State Modal Catat Pengeluaran Kas
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expenseKpspamsId, setExpenseKpspamsId] = useState<number>(effectiveKpspamsId || 1);
  const [expenseAccountId, setExpenseAccountId] = useState<number>(1);
  const [expenseCategory, setExpenseCategory] = useState<string>("OPERASIONAL");
  const [expenseAmount, setExpenseAmount] = useState<string>("");
  const [expenseDesc, setExpenseDesc] = useState<string>("");
  const [expenseProofNo, setExpenseProofNo] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // State Modal Cetak Laporan Keuangan Bulanan
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportCopied, setReportCopied] = useState<boolean>(false);

  // State Pencarian & Filter Mutasi
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter akun kas berdasarkan konteks KPSPAMS
  const filteredAccounts = accounts.filter((acc) => {
    if (effectiveKpspamsId === null) return true;
    return acc.kpspamsId === effectiveKpspamsId;
  });

  // Filter mutasi transaksi berdasarkan unit, pencarian, dan tipe
  const filteredTx = transactions.filter((tx) => {
    if (effectiveKpspamsId !== null && tx.kpspamsId !== effectiveKpspamsId) {
      return false;
    }
    if (typeFilter !== "ALL" && tx.type !== typeFilter) {
      return false;
    }
    if (categoryFilter !== "ALL" && tx.category !== categoryFilter) {
      return false;
    }
    if (
      searchQuery &&
      !tx.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !tx.txNumber.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Hitungan Agregat Keuangan
  const totalLiquidCash = filteredAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalOpeningBalance = filteredAccounts.reduce((sum, a) => sum + a.openingBalance, 0);

  const totalIncome = filteredTx
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTx
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  // Handler Atur Saldo Awal
  const handleOpenEditOpening = (acc: CashAccountState) => {
    setSelectedAcc(acc);
    setNewOpeningBalance(String(acc.openingBalance));
    setOpeningNotes("Penyesuaian saldo awal berdasarkan berita acara serah terima pengurus.");
    setShowOpeningModal(true);
  };

  const handleSaveOpeningBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcc) return;

    const val = parseFloat(newOpeningBalance) || 0;
    try {
      await apiClient(`/finance/cash-accounts/${selectedAcc.id}/opening-balance`, {
        method: "POST",
        body: JSON.stringify({
          opening_balance: val,
          opening_balance_date: new Date().toISOString().split("T")[0],
          notes: openingNotes || "Penyesuaian saldo awal resmi berita acara",
        }),
      });

      setSuccessMsg(
        `Saldo awal untuk ${selectedAcc.name} berhasil diperbarui di server menjadi Rp ${val.toLocaleString("id-ID")}.`
      );
      await fetchRealFinanceData();
    } catch (err: any) {
      alert(err?.message || "Gagal memperbarui saldo awal di server.");
    } finally {
      setShowOpeningModal(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  // Handler Buka Modal Pengeluaran Kas
  const handleOpenExpenseModal = () => {
    const targetKpspamsId = effectiveKpspamsId || 1;
    setExpenseKpspamsId(targetKpspamsId);
    const availableAccs = accounts.filter((a) => a.kpspamsId === targetKpspamsId);
    if (availableAccs.length > 0) {
      setExpenseAccountId(availableAccs[0].id);
    }
    setExpenseAmount("");
    setExpenseDesc("");
    setExpenseProofNo(`BKK-${Date.now().toString().slice(-6)}`);
    setExpenseCategory("OPERASIONAL");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setExpenseError(null);
    setShowExpenseModal(true);
  };

  // Handler Simpan Pengeluaran Kas
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount) || 0;

    if (amountNum <= 0) {
      setExpenseError("Nominal pengeluaran harus lebih besar dari Rp 0.");
      return;
    }

    const targetAcc = accounts.find((a) => a.id === expenseAccountId);
    if (!targetAcc) {
      setExpenseError("Pilih rekening/buku kas sumber dana yang valid.");
      return;
    }

    if (amountNum > targetAcc.currentBalance) {
      setExpenseError(
        `Saldo kas tidak mencukupi! Saldo saat ini: Rp ${targetAcc.currentBalance.toLocaleString("id-ID")}.`
      );
      return;
    }

    try {
      await apiClient("/finance/transactions", {
        method: "POST",
        body: JSON.stringify({
          cash_account_id: expenseAccountId,
          transaction_type: "EXPENSE",
          category: expenseCategory,
          amount: amountNum,
          transaction_date: expenseDate,
          description: expenseDesc.trim(),
        }),
      });

      setShowExpenseModal(false);
      setSuccessMsg(
        `Pengeluaran sebesar Rp ${amountNum.toLocaleString("id-ID")} (${expenseDesc}) berhasil dicatat dan diverifikasi di server.`
      );
      setTimeout(() => setSuccessMsg(null), 6000);
      await fetchRealFinanceData();
    } catch (err: any) {
      setExpenseError(err?.message || "Gagal mencatat transaksi pengeluaran di server.");
    }
  };

  // Handler Salin Laporan Format WhatsApp
  const handleCopyReportWa = () => {
    const kpspamsName =
      effectiveKpspamsId === null
        ? "Konsolidasi Seluruh Desa Kuajang"
        : DEMO_KPSPAMS_LIST.find((k) => k.id === effectiveKpspamsId)?.name;

    const waText =
      `*LAPORAN PERTANGGUNGJAWABAN KEUANGAN KPSPAMS*\n` +
      `*DESA KUAJANG, KEC. BINUANG*\n` +
      `Unit: ${kpspamsName}\n` +
      `Periode: Oktober 2026\n` +
      `----------------------------------------\n` +
      `• Total Saldo Awal (Opening) : Rp ${totalOpeningBalance.toLocaleString("id-ID")}\n` +
      `• Total Penerimaan Air Warga : Rp ${totalIncome.toLocaleString("id-ID")}\n` +
      `• Total Beban & Biaya Operasional : Rp ${totalExpense.toLocaleString("id-ID")}\n` +
      `----------------------------------------\n` +
      `*TOTAL SALDO KAS LIKUID AKTIF: Rp ${totalLiquidCash.toLocaleString("id-ID")}*\n` +
      `Tersebar di ${filteredAccounts.length} rekening kas tunai & bank unit.\n\n` +
      `_Laporan resmi digital Sistem Informasi KPSPAMS Desa Kuajang._`;

    navigator.clipboard.writeText(waText);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 4000);
  };

  // Handler Cetak Laporan
  const handlePrintReport = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-28 md:pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-maroon-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-brand-maroon-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-brand-gold-500/20 text-brand-gold-400 text-[11px] font-bold mb-1.5">
            <Wallet className="w-3.5 h-3.5" />
            <span>Manajemen Buku Kas & Pembukuan Resmi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Buku Kas & Laporan Keuangan KPSPAMS
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Pencatatan uang hasil tagihan lapangan, mutasi beban operasional pompa, dan laporan pertanggungjawaban.
          </p>
        </div>

        {/* Action Buttons in Banner */}
        <div className="flex flex-wrap items-center gap-2">
          {!isPetugasLapangan && (
            <Button
              variant="gold"
              size="sm"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={handleOpenExpenseModal}
            >
              + Catat Pengeluaran Kas
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            icon={<FileText className="w-4 h-4 text-brand-gold-400" />}
            onClick={() => setShowReportModal(true)}
          >
            Cetak Laporan Keuangan
          </Button>
        </div>
      </div>

      {/* Notice for Petugas Lapangan (Opsi C RBAC) */}
      {isPetugasLapangan && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Akses Monitoring Kas Petugas Lapangan: {user?.kpspamsName}</div>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                Uang tunai yang Anda tagih dari warga di lapangan otomatis tercatat langsung ke Buku Kas Unit ini. Pengeluaran kas dan saldo pembukuan dikelola oleh Bendahara & Ketua KPSPAMS.
              </p>
            </div>
          </div>
          <a
            href="/dashboard/penagihan-lapangan"
            className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center space-x-1.5 flex-shrink-0 transition shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Ke Penagihan Lapangan</span>
          </a>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Total Saldo Kas Likuid</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-tabular">
            Rp {totalLiquidCash.toLocaleString("id-ID")}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Tersebar di {filteredAccounts.length} rekening kas & bank
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Saldo Awal (Opening)</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-900 font-tabular">
            Rp {totalOpeningBalance.toLocaleString("id-ID")}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Audit serah terima kepengurusan
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Total Penerimaan Air</span>
            <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-tabular">
            + Rp {totalIncome.toLocaleString("id-ID")}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">
            Termasuk setoran tunai lapangan
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Beban & Pengeluaran</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 font-tabular">
            - Rp {totalExpense.toLocaleString("id-ID")}
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-semibold">
            Listrik PLN, pipa, & BBM pompa
          </div>
        </Card>
      </div>

      {/* Daftar Rekening & Buku Kas (Responsive Mobile Card + Desktop Table) */}
      <Card>
        <CardHeader
          title="Daftar Rekening Kas Tunai & Bank Unit KPSPAMS"
          subtitle="Setiap unit memiliki buku kas operasional tunai dan rekening bank terisolasi"
        />

        {/* Mobile View (< md) */}
        <div className="md:hidden space-y-3">
          {filteredAccounts.map((acc) => {
            const kpspams = DEMO_KPSPAMS_LIST.find((k) => k.id === acc.kpspamsId);
            return (
              <div
                key={acc.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {acc.code}
                  </span>
                  <Badge variant="brand" size="sm">{kpspams?.name || "Unit"}</Badge>
                </div>

                <div>
                  <div className="font-bold text-slate-900 text-sm">{acc.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                    <span>{acc.bankName}</span>
                    {acc.accountNumber !== "-" && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-slate-600">{acc.accountNumber}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Saldo Awal</div>
                    <div className="font-bold text-slate-700 font-tabular">
                      Rp {acc.openingBalance.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Saldo Kas Saat Ini</div>
                    <div className="font-black text-slate-900 font-tabular">
                      Rp {acc.currentBalance.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>

                {!isPetugasLapangan && (
                  <div className="pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full font-bold"
                      onClick={() => handleOpenEditOpening(acc)}
                    >
                      Atur Saldo Awal (Opening Balance)
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Kode Akun</th>
                <th className="px-4 py-3">Nama Akun & Lembaga</th>
                <th className="px-4 py-3">Unit KPSPAMS</th>
                <th className="px-4 py-3">No. Rekening</th>
                <th className="px-4 py-3 text-right">Saldo Awal</th>
                <th className="px-4 py-3 text-right">Saldo Saat Ini</th>
                {!isPetugasLapangan && <th className="px-4 py-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((acc) => {
                const kpspams = DEMO_KPSPAMS_LIST.find((k) => k.id === acc.kpspamsId);
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-slate-700">
                      {acc.code}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{acc.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{acc.bankName}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {kpspams?.name || "KPSPAMS"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">
                      {acc.accountNumber}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-600 font-tabular">
                      Rp {acc.openingBalance.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900 font-tabular">
                      Rp {acc.currentBalance.toLocaleString("id-ID")}
                    </td>
                    {!isPetugasLapangan && (
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleOpenEditOpening(acc)}
                          className="px-2.5 py-1 text-[11px] font-bold text-brand-maroon-800 bg-brand-maroon-50 hover:bg-brand-maroon-100 rounded-lg border border-brand-maroon-200 transition"
                        >
                          Atur Saldo Awal
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Riwayat Mutasi Arus Kas */}
      <Card>
        <CardHeader
          title={`Riwayat Mutasi Arus Kas (${filteredTx.length} Transaksi)`}
          subtitle="Tercatat otomatis dari penagihan lapangan serta pengeluaran operasional resmi"
        />

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari No. Kwitansi atau Keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
            >
              <option value="ALL">Semua Jenis Arus Kas</option>
              <option value="INCOME">Pemasukan (+ Penerimaan Air)</option>
              <option value="EXPENSE">Pengeluaran (- Biaya Operasional)</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="AIR_PAYMENT">Pembayaran Air Warga</option>
              <option value="OPERASIONAL">Listrik PLN / BBM Pompa</option>
              <option value="MAINTENANCE">Perbaikan Pipa & Kran</option>
              <option value="BAHAN_KIMIA">Kaporit & Penjernih</option>
              <option value="HONOR">Honor Petugas Lapangan</option>
              <option value="LAINNYA">Lain-lain</option>
            </select>
          </div>
        </div>

        {/* Mobile View (< md) */}
        <div className="md:hidden space-y-2.5">
          {filteredTx.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
              Belum ada mutasi transaksi yang sesuai dengan filter.
            </div>
          ) : (
            filteredTx.map((tx) => (
              <div key={tx.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-700">{tx.txNumber}</span>
                  <span className="text-slate-400 text-[10px]">{tx.date}</span>
                </div>
                <div className="font-semibold text-slate-900 text-xs">{tx.description}</div>
                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.type === "INCOME"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {tx.type === "INCOME" ? "+ Pemasukan" : "- Pengeluaran"} ({tx.category})
                  </span>
                  <span
                    className={`font-black font-tabular text-xs ${
                      tx.type === "INCOME" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {tx.type === "INCOME" ? "+" : "-"} Rp {tx.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">No. Transaksi</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Unit KPSPAMS</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada data mutasi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5 font-mono text-[11px] font-semibold text-slate-800">
                      {tx.txNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{tx.date}</td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{tx.kpspamsName}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          tx.type === "INCOME"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+ Pemasukan" : "- Pengeluaran"} ({tx.category})
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td
                      className={`px-4 py-3.5 text-right font-black font-tabular ${
                        tx.type === "INCOME" ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"} Rp {tx.amount.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Atur Saldo Awal (Opening Balance) */}
      {showOpeningModal && selectedAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Atur Saldo Awal (Opening Balance)
              </h3>
              <button onClick={() => setShowOpeningModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Ubah nominal saldo awal pembukuan untuk rekening: <br />
              <strong className="text-slate-800">{selectedAcc.name}</strong>
            </p>

            <form onSubmit={handleSaveOpeningBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nominal Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(e.target.value)}
                  required
                  min={0}
                  step={1000}
                  className="w-full text-base px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 font-mono font-black"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Gunakan angka nominal riil hasil audit serah terima jabatan pengurus.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Dasar Perubahan
                </label>
                <textarea
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  rows={3}
                  required
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                  placeholder="Misal: Berdasarkan Berita Acara Rekonsiliasi Kas Tanggal..."
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowOpeningModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold"
                >
                  Simpan Saldo Awal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Catat Pengeluaran Kas Operasional */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <MinusCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Catat Beban & Pengeluaran Kas
                </h3>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {expenseError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {expenseError}
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Unit KPSPAMS */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit KPSPAMS
                  </label>
                  <select
                    disabled={!isDesaLevel}
                    value={expenseKpspamsId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setExpenseKpspamsId(id);
                      const matching = accounts.filter((a) => a.kpspamsId === id);
                      if (matching.length > 0) setExpenseAccountId(matching[0].id);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  >
                    {DEMO_KPSPAMS_LIST.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sumber Kas / Rekening */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sumber Kas / Rekening Bank
                  </label>
                  <select
                    value={expenseAccountId}
                    onChange={(e) => setExpenseAccountId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  >
                    {accounts
                      .filter((a) => a.kpspamsId === expenseKpspamsId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (Saldo: Rp {a.currentBalance.toLocaleString("id-ID")})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Kategori Pengeluaran */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  >
                    <option value="OPERASIONAL">Listrik PLN Pompa / BBM Solar Genset</option>
                    <option value="MAINTENANCE">Perbaikan Pipa, Kran & Fitting</option>
                    <option value="BAHAN_KIMIA">Kaporit & Bahan Penjernih Air</option>
                    <option value="HONOR">Honor Petugas Lapangan & Pengurus</option>
                    <option value="LAINNYA">ATK, Konsumsi & Musyawarah</option>
                  </select>
                </div>

                {/* Tanggal Pengeluaran */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  />
                </div>

                {/* Nominal Pengeluaran */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Biaya Pengeluaran (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    placeholder="Contoh: 350000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base font-black font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  />
                </div>

                {/* Keterangan */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Keterangan & Rincian Keperluan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pembelian 3 batang Pipa PVC 2 inch & Stop Kran Dusun Pakkandoang"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  />
                </div>

                {/* Nomor Bukti / Nota Fisik */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Bukti Kas Keluar / Nota Fisik
                  </label>
                  <input
                    type="text"
                    value={expenseProofNo}
                    onChange={(e) => setExpenseProofNo(e.target.value)}
                    placeholder="Contoh: BKK-092-2026 atau No. Nota Toko Bangunan"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowExpenseModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold bg-rose-700 hover:bg-rose-800"
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Simpan Pengeluaran Kas
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cetak Laporan Keuangan Bulanan (Print-Friendly A4 & WhatsApp) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Header Modal & Tombol Aksi Cetak */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-brand-maroon-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Pratinjau Laporan Keuangan Resmi (A4)
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyReportWa}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {reportCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{reportCopied ? "Tersalin!" : "Salin Format WA"}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="px-3.5 py-1.5 rounded-xl bg-brand-maroon-800 hover:bg-brand-maroon-900 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 p-1 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Report Document Body (A4 Ready) */}
            <div id="printable-financial-report" className="space-y-6 text-slate-900 text-xs">
              {/* Kop Surat Resmi */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <div className="text-xs uppercase tracking-widest font-bold text-slate-600">
                  Pemerintah Kabupaten Polewali Mandar • Kecamatan Binuang
                </div>
                <div className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight">
                  Pemerintah Desa Kuajang
                </div>
                <div className="text-xs font-extrabold text-brand-maroon-900 tracking-wide uppercase">
                  Badan Pengelola Sistem Penyediaan Air Minum & Sanitasi (KPSPAMS)
                </div>
                <div className="text-[10px] text-slate-500">
                  Sekretariat: Kantor Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar, Sulawesi Barat 91353
                </div>
              </div>

              {/* Title & Scope */}
              <div className="text-center py-1">
                <h4 className="text-sm font-black uppercase tracking-wider underline">
                  Laporan Pertanggungjawaban Arus Kas & Keuangan
                </h4>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">
                  Unit: {effectiveKpspamsId === null ? "Konsolidasi Seluruh Desa Kuajang" : DEMO_KPSPAMS_LIST.find((k) => k.id === effectiveKpspamsId)?.name} • Periode: Oktober 2026
                </div>
              </div>

              {/* Ringkasan Eksekutif Neraca Kas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Saldo Awal</div>
                  <div className="text-sm font-extrabold font-tabular text-slate-800">
                    Rp {totalOpeningBalance.toLocaleString("id-ID")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Penerimaan</div>
                  <div className="text-sm font-extrabold font-tabular text-emerald-700">
                    + Rp {totalIncome.toLocaleString("id-ID")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Beban/Biaya</div>
                  <div className="text-sm font-extrabold font-tabular text-rose-700">
                    - Rp {totalExpense.toLocaleString("id-ID")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Saldo Akhir Likuid</div>
                  <div className="text-sm font-black font-tabular text-brand-maroon-900">
                    Rp {totalLiquidCash.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* Rincian Transaksi Lengkap */}
              <div>
                <div className="font-bold text-xs mb-2">Rincian Mutasi Arus Kas Buku Kas:</div>
                <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-700">
                      <th className="p-2 border border-slate-300">No. Bukti</th>
                      <th className="p-2 border border-slate-300">Tanggal</th>
                      <th className="p-2 border border-slate-300">Kategori</th>
                      <th className="p-2 border border-slate-300">Uraian / Keterangan</th>
                      <th className="p-2 border border-slate-300 text-right">Pemasukan</th>
                      <th className="p-2 border border-slate-300 text-right">Pengeluaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map((t) => (
                      <tr key={t.id} className="border-b border-slate-200">
                        <td className="p-2 font-mono font-semibold border border-slate-300">{t.txNumber}</td>
                        <td className="p-2 border border-slate-300">{t.date}</td>
                        <td className="p-2 border border-slate-300">{t.category}</td>
                        <td className="p-2 border border-slate-300">{t.description}</td>
                        <td className="p-2 text-right font-tabular border border-slate-300">
                          {t.type === "INCOME" ? `Rp ${t.amount.toLocaleString("id-ID")}` : "-"}
                        </td>
                        <td className="p-2 text-right font-tabular border border-slate-300 text-rose-700">
                          {t.type === "EXPENSE" ? `Rp ${t.amount.toLocaleString("id-ID")}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={4} className="p-2 text-right border border-slate-300">Total Akumulasi:</td>
                      <td className="p-2 text-right font-tabular border border-slate-300 text-emerald-700">
                        Rp {totalIncome.toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 text-right font-tabular border border-slate-300 text-rose-700">
                        Rp {totalExpense.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Tanda Tangan & Pengesahan Resmi */}
              <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-500">Mengetahui,</div>
                  <div className="font-bold text-slate-900">Kepala Desa Kuajang</div>
                  <div className="h-16 flex items-center justify-center text-[10px] text-slate-300 italic">
                    [Tanda Tangan & Cap]
                  </div>
                  <div className="font-bold underline text-slate-900">H. Muhammad Basir, S.Sos.</div>
                  <div className="text-[10px] text-slate-500">NIP. 19740512 200212 1 004</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500">Disetujui,</div>
                  <div className="font-bold text-slate-900">Ketua KPSPAMS</div>
                  <div className="h-16 flex items-center justify-center text-[10px] text-slate-300 italic">
                    [Tanda Tangan]
                  </div>
                  <div className="font-bold underline text-slate-900">
                    {effectiveKpspamsId === 1 ? "Hasanuddin" : effectiveKpspamsId === 2 ? "Abdul Rauf" : "Drs. Usman Ali"}
                  </div>
                  <div className="text-[10px] text-slate-500">Ketua Pengelola</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500">Kuajang, 31 Oktober 2026</div>
                  <div className="font-bold text-slate-900">Bendahara KPSPAMS</div>
                  <div className="h-16 flex items-center justify-center text-[10px] text-slate-300 italic">
                    [Tanda Tangan]
                  </div>
                  <div className="font-bold underline text-slate-900">
                    {effectiveKpspamsId === 1 ? "Rahmawati" : "Bendahara Unit"}
                  </div>
                  <div className="text-[10px] text-slate-500">Pemegang Kas Resmi</div>
                </div>
              </div>
            </div>

            {/* Footer Modal Action */}
            <div className="mt-8 flex justify-end pt-4 border-t border-slate-200 print:hidden">
              <Button variant="secondary" size="sm" onClick={() => setShowReportModal(false)}>
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
