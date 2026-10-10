"use client";

import React, { useState, useMemo } from "react";
import {
  MessageCircle,
  Send,
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  Phone,
  Sparkles,
  X,
  Search,
  Filter,
  Users,
  Clock,
  AlertCircle,
  Calendar,
  Building2,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface BroadcastCustomer {
  id: number;
  name: string;
  connectionNo: string;
  phone?: string;
  dusun: string;
  kpspamsName?: string;
  billingStatus?: "PAID" | "UNPAID" | string;
  totalAmount?: number;
  periodName?: string;
  dueDate?: string;
}

interface WaBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: BroadcastCustomer[];
  defaultKpspamsName?: string;
  defaultPeriodName?: string;
  defaultDueDate?: string;
}

export function WaBroadcastModal({
  isOpen,
  onClose,
  customers,
  defaultKpspamsName = "KPSPAMS Lemo Baru",
  defaultPeriodName = "Oktober 2026",
  defaultDueDate = "20 Oktober 2026",
}: WaBroadcastModalProps) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | "UNPAID" | "PAID">("ALL");
  const [filterDusun, setFilterDusun] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTemplateType, setActiveTemplateType] = useState<"TAGIHAN" | "LUNAS">("TAGIHAN");

  // Track sent status by customer ID
  const [sentCustomerIds, setSentCustomerIds] = useState<Set<number>>(new Set());
  const [copiedCustomerId, setCopiedCustomerId] = useState<number | null>(null);

  // Editable phone numbers locally in modal
  const [editedPhones, setEditedPhones] = useState<Record<number, string>>({});
  const [editingPhoneId, setEditingPhoneId] = useState<number | null>(null);
  const [tempPhoneInput, setTempPhoneInput] = useState("");

  // Dusun list extracted from customers
  const dusunList = useMemo(() => {
    const list = Array.from(new Set(customers.map((c) => c.dusun).filter(Boolean)));
    return list.sort();
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Status filter
      if (filterStatus === "UNPAID" && c.billingStatus === "PAID") return false;
      if (filterStatus === "PAID" && c.billingStatus !== "PAID") return false;

      // Dusun filter
      if (filterDusun !== "ALL" && c.dusun !== filterDusun) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchSr = c.connectionNo.toLowerCase().includes(q);
        const matchPhone = (editedPhones[c.id] || c.phone || "").toLowerCase().includes(q);
        if (!matchName && !matchSr && !matchPhone) return false;
      }

      return true;
    });
  }, [customers, filterStatus, filterDusun, searchQuery, editedPhones]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredCustomers.length;
    const sent = filteredCustomers.filter((c) => sentCustomerIds.has(c.id)).length;
    const withPhone = filteredCustomers.filter((c) => Boolean(editedPhones[c.id] || c.phone)).length;
    const noPhone = total - withPhone;
    return { total, sent, withPhone, noPhone };
  }, [filteredCustomers, sentCustomerIds, editedPhones]);

  // Build message draft for a customer
  const buildMessage = (c: BroadcastCustomer, type: "TAGIHAN" | "LUNAS") => {
    const kpspams = c.kpspamsName || defaultKpspamsName;
    const period = c.periodName || defaultPeriodName;
    const nominal = (c.totalAmount || 10000).toLocaleString("id-ID");
    const dueDate = c.dueDate || defaultDueDate;
    const sr = c.connectionNo;
    const portalUrl = `https://sikpspams-kuajang.pages.dev/portal?sr=${encodeURIComponent(sr)}`;

    if (type === "LUNAS" || c.billingStatus === "PAID") {
      return `Yth. Bpk/Ibu ${c.name}, terima kasih pembayaran tagihan air bersih ${kpspams} periode ${period} sebesar Rp ${nominal},- telah LUNAS. Cek & unduh kwitansi resmi di: ${portalUrl}`;
    }

    return `Yth. Bpk/Ibu ${c.name}, tagihan air bersih ${kpspams} periode ${period} sebesar Rp ${nominal},- telah terbit. Jatuh tempo: ${dueDate}. Cek rincian di: ${portalUrl}`;
  };

  // Generate WhatsApp link
  const getWhatsAppLink = (c: BroadcastCustomer) => {
    const phone = editedPhones[c.id] || c.phone || "";
    const clean = phone.replace(/\D/g, "");
    if (!clean) return "";

    const formatted = clean.startsWith("0") ? "62" + clean.slice(1) : clean.startsWith("62") ? clean : `62${clean}`;
    const text = buildMessage(c, activeTemplateType);
    return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
  };

  // Handle Send Click
  const handleSendWa = (c: BroadcastCustomer) => {
    const link = getWhatsAppLink(c);
    if (!link) {
      setEditingPhoneId(c.id);
      setTempPhoneInput("");
      return;
    }

    window.open(link, "_blank");
    setSentCustomerIds((prev) => new Set(prev).add(c.id));
  };

  // Handle Copy Message
  const handleCopyMessage = (c: BroadcastCustomer) => {
    const text = buildMessage(c, activeTemplateType);
    navigator.clipboard.writeText(text);
    setCopiedCustomerId(c.id);
    setTimeout(() => {
      setCopiedCustomerId(null);
    }, 2000);
  };

  // Save phone number edit locally
  const handleSavePhone = (cId: number) => {
    if (tempPhoneInput.trim()) {
      setEditedPhones((prev) => ({
        ...prev,
        [cId]: tempPhoneInput.trim(),
      }));
    }
    setEditingPhoneId(null);
    setTempPhoneInput("");
  };

  // Find next unsent customer
  const nextUnsentCustomer = useMemo(() => {
    return filteredCustomers.find((c) => !sentCustomerIds.has(c.id) && Boolean(editedPhones[c.id] || c.phone));
  }, [filteredCustomers, sentCustomerIds, editedPhones]);

  if (!isOpen) return null;

  const sampleCustomer = filteredCustomers[0] || customers[0] || {
    id: 1,
    name: "SYAHARUDDIN",
    connectionNo: "SR-LMB-00009",
    dusun: "Lemo Baru",
    phone: "082347170047",
    kpspamsName: defaultKpspamsName,
    totalAmount: 10000,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-6 flex-shrink-0 flex items-center justify-between border-b border-emerald-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Pengingat Tagihan &amp; Broadcast WhatsApp
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-slate-950 uppercase">
                  Desa Kuajang
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-100/90 mt-0.5">
                Kirim pesan tagihan resmi personal langsung ke nomor WhatsApp warga dengan tautan rincian portal mandiri.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar & Live Preview */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex-shrink-0 space-y-3.5">
          {/* Live WhatsApp Message Bubble Preview */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pratinjau Draf Pesan WhatsApp Warga:</span>
              </div>
              <div className="flex items-center space-x-1 p-0.5 bg-white rounded-lg border border-emerald-200 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTemplateType("TAGIHAN")}
                  className={`px-2 py-0.5 rounded transition ${
                    activeTemplateType === "TAGIHAN"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pemberitahuan Tagihan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplateType("LUNAS")}
                  className={`px-2 py-0.5 rounded transition ${
                    activeTemplateType === "LUNAS"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Konfirmasi Lunas
                </button>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs font-sans text-xs text-slate-800 leading-relaxed relative pl-4 border-l-4 border-l-emerald-600">
              {buildMessage(sampleCustomer, activeTemplateType)}
            </div>
          </div>

          {/* Filter Bar & Quick Stats */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari warga, No. SR, atau HP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e: any) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">Semua Status (Lunas &amp; Belum)</option>
                <option value="UNPAID">Hanya Belum Lunas</option>
                <option value="PAID">Hanya Sudah Lunas</option>
              </select>

              {/* Dusun Filter */}
              <select
                value={filterDusun}
                onChange={(e) => setFilterDusun(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">Semua Dusun</option>
                {dusunList.map((d) => (
                  <option key={d} value={d}>
                    Dusun {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
              <span>Total: <strong className="text-slate-900">{stats.total}</strong></span>
              <span>•</span>
              <span className="text-emerald-700">Terkirim: <strong>{stats.sent}</strong></span>
              <span>•</span>
              <span className="text-slate-500">Ada WA: <strong>{stats.withPhone}</strong></span>
            </div>
          </div>
        </div>

        {/* Customer Broadcast Queue Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Tidak ada pelanggan yang cocok dengan filter.</p>
              <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau filter status.</p>
            </div>
          ) : (
            filteredCustomers.map((cust, idx) => {
              const phone = editedPhones[cust.id] || cust.phone;
              const isSent = sentCustomerIds.has(cust.id);
              const isPaid = cust.billingStatus === "PAID";
              const isEditingPhone = editingPhoneId === cust.id;

              return (
                <div
                  key={cust.id}
                  className={`py-3 px-2 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSent ? "bg-emerald-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Left Info: Index, Name, SR, Dusun */}
                  <div className="flex items-start space-x-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                        isSent
                          ? "bg-emerald-200 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isSent ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {cust.name}
                        </span>
                        <Badge
                          variant={isPaid ? "success" : "danger"}
                          size="sm"
                          className="text-[9px] px-1.5 py-0 font-bold"
                        >
                          {isPaid ? "Lunas" : "Belum Bayar"}
                        </Badge>
                        <span className="text-[10px] font-mono font-bold text-brand-maroon-900">
                          {cust.connectionNo}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <span>Dusun {cust.dusun}</span>
                        <span>•</span>
                        <span>Nominal: <strong className="font-tabular text-slate-800">Rp {(cust.totalAmount || 10000).toLocaleString("id-ID")}</strong></span>
                        <span>•</span>

                        {/* Phone Number Display / Edit */}
                        {isEditingPhone ? (
                          <div className="inline-flex items-center space-x-1">
                            <input
                              type="text"
                              autoFocus
                              placeholder="08xxxxxxxxxx"
                              value={tempPhoneInput}
                              onChange={(e) => setTempPhoneInput(e.target.value)}
                              className="px-2 py-0.5 text-[11px] font-mono border border-emerald-500 rounded bg-white w-28"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePhone(cust.id)}
                              className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPhoneId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {phone ? (
                              <span className="font-mono text-emerald-700 font-semibold">{phone}</span>
                            ) : (
                              <span className="text-amber-600 font-bold text-[10px] bg-amber-50 px-1.5 py-0.2 rounded">
                                Belum ada WA
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPhoneId(cust.id);
                                setTempPhoneInput(phone || "");
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title="Ubah nomor WhatsApp"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: WhatsApp Button & Copy Button */}
                  <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(cust)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition flex items-center space-x-1 active:scale-95"
                      title="Salin teks pesan ke clipboard"
                    >
                      {copiedCustomerId === cust.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendWa(cust)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm transition flex items-center space-x-1.5 active:scale-95 ${
                        isSent
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                          : phone
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-700/20"
                          : "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{isSent ? "Kirim Ulang" : phone ? "Kirim WA" : "Input No. WA"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Terkirim sesi ini: <strong className="text-slate-900">{stats.sent}</strong> dari {stats.total} warga terpilih.
            </span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            {nextUnsentCustomer && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSendWa(nextUnsentCustomer)}
                icon={<Send className="w-3.5 h-3.5" />}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Kirim Berikutnya ({nextUnsentCustomer.name})
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
