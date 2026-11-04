"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import {
  Camera,
  Plus,
  Trash2,
  Share2,
  ExternalLink,
  MapPin,
  Calendar,
  User,
  Wrench,
  Mountain,
  Droplet,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Link as LinkIcon,
  Receipt,
  Check,
} from "lucide-react";

interface ActivityDoc {
  id: number;
  kpspams_id?: number;
  kpspams_name?: string;
  title: string;
  category: "PERBAIKAN_PIPA" | "PERAWATAN_INTAKE" | "PASANG_BARU" | "MUSYAWARAH" | "UJI_KUALITAS" | string;
  dusun: string;
  activity_date: string;
  person_in_charge: string;
  description: string;
  cash_reference?: string | null;
  image_url: string;
  before_image_url?: string | null;
  after_image_url?: string | null;
  has_before_after?: boolean;
  created_at?: string;
}

const PRESET_PHOTO_TEMPLATES = [
  {
    name: "Perbaikan Pipa PVC",
    url: "/gallery/perbaikan-pipa.jpg",
    beforeUrl: "/gallery/pipa-retak-sebelum.jpg",
    cat: "PERBAIKAN_PIPA",
  },
  {
    name: "Pembersihan Bak Intake",
    url: "/gallery/intake-mata-air.jpg",
    beforeUrl: "/gallery/intake-kotor-sebelum.jpg",
    cat: "PERAWATAN_INTAKE",
  },
  {
    name: "Pemasangan SR & Stop Kran",
    url: "/gallery/pasang-sr-meteran.jpg",
    cat: "PASANG_BARU",
  },
  {
    name: "Musyawarah Pengurus & BPD",
    url: "/gallery/musyawarah-desa.jpg",
    cat: "MUSYAWARAH",
  },
  {
    name: "Kalibrasi & Uji Meter Air",
    url: "/gallery/uji-meteran.jpg",
    cat: "UJI_KUALITAS",
  },
  {
    name: "Gotong Royong Jalur Pipa",
    url: "/gallery/pipa-longsor.jpg",
    cat: "PERBAIKAN_PIPA",
  },
];

export default function DashboardDokumentasiPage() {
  const { user, isDesaLevel, activeKpspamsId } = useAuth();
  const [activities, setActivities] = useState<ActivityDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDusun, setSelectedDusun] = useState("Semua Dusun");

  // Modal & Preview state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<ActivityDoc | null>(null);
  const [lightboxMode, setLightboxMode] = useState<"after" | "before">("after");
  const [cardToggle, setCardToggle] = useState<Record<number, "after" | "before">>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: "",
    category: "PERBAIKAN_PIPA",
    dusun: "Lemo Baru",
    activity_date: new Date().toISOString().split("T")[0],
    person_in_charge: "Sabir & Tim Teknisi",
    description: "",
    cash_reference: "",
    image_url: "/gallery/perbaikan-pipa.jpg",
    has_before_after: false,
    before_image_url: "",
    after_image_url: "",
  });

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "/documentations";
      const params = new URLSearchParams();
      if (!isDesaLevel && activeKpspamsId) {
        params.append("kpspams_id", String(activeKpspamsId));
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const res = await apiClient(url);
      if (res?.status === "success" && Array.isArray(res.data)) {
        setActivities(res.data);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isDesaLevel, activeKpspamsId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleOpenAddModal = () => {
    setFormData({
      title: "",
      category: "PERBAIKAN_PIPA",
      dusun: activeKpspamsId === 2 ? "Lemo Tua" : activeKpspamsId === 3 ? "Sarampu" : "Lemo Baru",
      activity_date: new Date().toISOString().split("T")[0],
      person_in_charge: user?.name ? `${user.name} & Tim` : "Sabir & Tim Teknisi",
      description: "",
      cash_reference: "",
      image_url: "/gallery/perbaikan-pipa.jpg",
      has_before_after: false,
      before_image_url: "",
      after_image_url: "",
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (tpl: (typeof PRESET_PHOTO_TEMPLATES)[0]) => {
    setFormData((prev) => ({
      ...prev,
      category: tpl.cat,
      image_url: tpl.url,
      has_before_after: Boolean(tpl.beforeUrl),
      before_image_url: tpl.beforeUrl || "",
      after_image_url: tpl.url,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMessage("Judul kegiatan wajib diisi.");
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage("Deskripsi ringkasan pengerjaan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        kpspams_id: activeKpspamsId || 1,
        title: formData.title.trim(),
        category: formData.category,
        dusun: formData.dusun,
        activity_date: formData.activity_date,
        person_in_charge: formData.person_in_charge.trim(),
        description: formData.description.trim(),
        cash_reference: formData.cash_reference.trim() || null,
        image_url: formData.has_before_after && formData.after_image_url ? formData.after_image_url : formData.image_url,
        before_image_url: formData.has_before_after ? formData.before_image_url : null,
        after_image_url: formData.has_before_after ? formData.after_image_url : null,
        has_before_after: formData.has_before_after,
      };

      const res = await apiClient("/documentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res?.status === "success") {
        setSuccessToast("Dokumentasi kegiatan lapangan berhasil disimpan dan dipublikasikan!");
        setTimeout(() => setSuccessToast(null), 4000);
        setIsModalOpen(false);
        fetchActivities();
      } else {
        setErrorMessage(res?.message || "Gagal menyimpan dokumentasi.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan koneksi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus dokumentasi kegiatan:\n"${title}"?`)) {
      return;
    }

    try {
      const res = await apiClient(`/documentations?id=${id}`, {
        method: "DELETE",
      });
      if (res?.status === "success") {
        setActivities((prev) => prev.filter((a) => a.id !== id));
        setSuccessToast("Dokumentasi kegiatan berhasil dihapus.");
        setTimeout(() => setSuccessToast(null), 3000);
      } else {
        alert(res?.message || "Gagal menghapus.");
      }
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus dokumentasi.");
    }
  };

  const handleShareWa = (item: ActivityDoc) => {
    const text =
      `*DOKUMENTASI KEGIATAN KPSPAMS DESA KUAJANG*\n` +
      `*${item.title}*\n` +
      `Wilayah: Dusun ${item.dusun} • Tanggal: ${item.activity_date}\n` +
      `Pelaksana: ${item.person_in_charge}\n\n` +
      `"${item.description}"\n\n` +
      (item.cash_reference ? `Terhubung Kas Riil: ${item.cash_reference}\n` : "") +
      `Lihat galeri transparansi: https://sikpspams-kuajang.pages.dev`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const matchDusun = selectedDusun === "Semua Dusun" || item.dusun === selectedDusun;
      const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.person_in_charge.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.cash_reference && item.cash_reference.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchDusun && matchCat && matchSearch;
    });
  }, [activities, selectedDusun, selectedCategory, searchQuery]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = activities.length;
    const perbaikanPipa = activities.filter((a) => a.category === "PERBAIKAN_PIPA").length;
    const perawatanIntake = activities.filter((a) => a.category === "PERAWATAN_INTAKE").length;
    const terhubungKas = activities.filter((a) => a.cash_reference).length;
    return { total, perbaikanPipa, perawatanIntake, terhubungKas };
  }, [activities]);

  const formatDateIndo = (dateStr: string) => {
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

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "PERBAIKAN_PIPA":
        return <Badge variant="brand" size="sm">🛠️ Perbaikan Pipa</Badge>;
      case "PERAWATAN_INTAKE":
        return <Badge variant="success" size="sm">🏞️ Intake &amp; Sumber</Badge>;
      case "PASANG_BARU":
        return <Badge variant="info" size="sm">💧 Sambungan Baru</Badge>;
      case "MUSYAWARAH":
        return <Badge variant="neutral" size="sm">👥 Musyawarah &amp; BPD</Badge>;
      case "UJI_KUALITAS":
        return <Badge variant="warning" size="sm">🔍 Uji Fisik Meteran</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{cat}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200/80 mb-2">
              <Camera className="w-3.5 h-3.5 text-sky-600" />
              <span>Transparansi Bukti Fisik Lapangan</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Galeri Dokumentasi Kegiatan &amp; Perawatan Jaringan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Arsip visual pekerjaan riil teknisi KPSPAMS Desa Kuajang: perbaikan pipa bocor, pembersihan bak penampung gravitasi, pemasangan SR baru, dan musyawarah bersama warga/BPD.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              disabled={isLoading}
              icon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />}
            >
              Segarkan
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              icon={<Plus className="w-4 h-4" />}
              className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold shadow-sm"
            >
              Unggah Dokumentasi Baru
            </Button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 rounded-2xl border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Total Kegiatan</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 font-tabular">{stats.total}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Dokumentasi tersimpan</p>
          </Card>

          <Card className="p-4 rounded-2xl border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Perbaikan Pipa</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-700 mt-2 font-tabular">{stats.perbaikanPipa}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Jalur &amp; aksesoris fitting</p>
          </Card>

          <Card className="p-4 rounded-2xl border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Perawatan Intake</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Mountain className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2 font-tabular">{stats.perawatanIntake}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Bak gravitasi alami</p>
          </Card>

          <Card className="p-4 rounded-2xl border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Terhubung Kas</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-700 mt-2 font-tabular">{stats.terhubungKas}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Bukti kuitansi belanja</p>
          </Card>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Dusun Selector */}
          <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto scrollbar-none">
            {["Semua Dusun", "Lemo Baru", "Lemo Tua", "Sarampu"].map((dus) => (
              <button
                key={dus}
                type="button"
                onClick={() => setSelectedDusun(dus)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDusun === dus
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {dus}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2.5 w-full md:w-auto">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="PERBAIKAN_PIPA">🛠️ Perbaikan Pipa</option>
              <option value="PERAWATAN_INTAKE">🏞️ Intake &amp; Bak Gravitasi</option>
              <option value="PASANG_BARU">💧 Sambungan Baru (SR)</option>
              <option value="MUSYAWARAH">👥 Musyawarah &amp; BPD</option>
              <option value="UJI_KUALITAS">🔍 Uji Fisik &amp; Meteran</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul / teknisi / nota..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {isLoading && activities.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold">Memuat arsip dokumentasi kegiatan...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
            <Camera className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Tidak ada dokumentasi yang cocok</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ditemukan foto kegiatan dengan filter terpilih. Coba ubah dusun, kategori, atau tambahkan dokumentasi baru.
            </p>
            <Button variant="primary" size="sm" onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>
              Tambah Dokumentasi Sekarang
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredActivities.map((act) => {
              const currentMode = cardToggle[act.id] || "after";
              const currentImg =
                act.has_before_after && currentMode === "before" && act.before_image_url
                  ? act.before_image_url
                  : act.after_image_url || act.image_url;

              return (
                <div
                  key={act.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative h-48 sm:h-52 w-full bg-slate-900 overflow-hidden">
                      <Image
                        src={currentImg}
                        alt={act.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                        onClick={() => {
                          setLightboxItem(act);
                          setLightboxMode(currentMode);
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <div className="pointer-events-auto">
                          {getCategoryBadge(act.category)}
                        </div>
                        <div className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold border border-white/20 flex items-center space-x-1 shadow-sm pointer-events-auto">
                          <MapPin className="w-3 h-3 text-sky-400" />
                          <span>Dusun {act.dusun}</span>
                        </div>
                      </div>

                      {/* Before / After Switcher on Card */}
                      {act.has_before_after && act.before_image_url && (
                        <div className="absolute bottom-3 left-3 flex items-center bg-slate-900/85 backdrop-blur-xs p-1 rounded-xl border border-white/20 text-[10px] font-extrabold text-white shadow-lg space-x-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardToggle((prev) => ({ ...prev, [act.id]: "before" }));
                            }}
                            className={`px-2 py-0.5 rounded-lg transition ${
                              currentMode === "before"
                                ? "bg-rose-600 text-white shadow-xs"
                                : "text-slate-300 hover:text-white"
                            }`}
                          >
                            Sebelum
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardToggle((prev) => ({ ...prev, [act.id]: "after" }));
                            }}
                            className={`px-2 py-0.5 rounded-lg transition ${
                              currentMode === "after"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-300 hover:text-white"
                            }`}
                          >
                            Sesudah
                          </button>
                        </div>
                      )}

                      {/* Zoom Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setLightboxItem(act);
                          setLightboxMode(currentMode);
                        }}
                        className="absolute bottom-3 right-3 w-8 h-8 rounded-xl bg-slate-900/80 backdrop-blur-xs text-white flex items-center justify-center hover:bg-slate-900 transition border border-white/20"
                        title="Perbesar Pratinjau Foto"
                      >
                        <Eye className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateIndo(act.activity_date)}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1 truncate max-w-[150px]">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{act.person_in_charge}</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-sky-600 transition">
                        {act.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {act.description}
                      </p>

                      {/* Cash Link Badge */}
                      {act.cash_reference && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-[11px]">
                          <div className="flex items-center space-x-1.5 truncate">
                            <Receipt className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                            <span className="text-slate-600 font-medium">Bukti Kas:</span>
                            <strong className="text-amber-900 font-bold truncate">{act.cash_reference}</strong>
                          </div>
                          <Link
                            href="/dashboard/keuangan"
                            className="text-amber-700 hover:text-amber-900 font-bold text-[10px] underline flex-shrink-0 ml-2"
                          >
                            Buku Kas
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleShareWa(act)}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition py-1"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kirim WA</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLightboxItem(act);
                          setLightboxMode(currentMode);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                        title="Pratinjau Layar Penuh"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(act.id, act.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus Dokumentasi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Tambah Dokumentasi Baru */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-7 border border-slate-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Unggah Dokumentasi Kegiatan Baru</h3>
                    <p className="text-xs text-slate-500">Bukti visual kegiatan riil teknisi &amp; pengurus di lapangan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Template Preset Picker */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Pilih Contoh Cepat / Foto Bertema:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_PHOTO_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(tpl)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-sky-500 text-[11px] font-bold text-slate-700 hover:text-sky-700 text-left transition truncate"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Judul Kegiatan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Judul Kegiatan Lapangan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Penggantian Pipa PVC 2 Inch Retak di Jembatan Dusun"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* Kategori & Dusun */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori Kegiatan</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                    >
                      <option value="PERBAIKAN_PIPA">🛠️ Perbaikan Pipa &amp; Aksesoris</option>
                      <option value="PERAWATAN_INTAKE">🏞️ Perawatan Intake &amp; Bak Gravitasi</option>
                      <option value="PASANG_BARU">💧 Pemasangan Sambungan Baru (SR)</option>
                      <option value="MUSYAWARAH">👥 Musyawarah &amp; Rekonsiliasi Kas</option>
                      <option value="UJI_KUALITAS">🔍 Uji Fisik &amp; Kalibrasi Meteran</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Wilayah / Dusun</label>
                    <select
                      value={formData.dusun}
                      onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                    >
                      <option value="Lemo Baru">Dusun Lemo Baru</option>
                      <option value="Lemo Tua">Dusun Lemo Tua</option>
                      <option value="Sarampu">Dusun Sarampu</option>
                    </select>
                  </div>
                </div>

                {/* Tanggal & Pelaksana */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                    <input
                      type="date"
                      required
                      value={formData.activity_date}
                      onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teknisi / Pelaksana</label>
                    <input
                      type="text"
                      required
                      value={formData.person_in_charge}
                      onChange={(e) => setFormData({ ...formData, person_in_charge: e.target.value })}
                      placeholder="Contoh: Sabir &amp; Tim Teknisi"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Hubungkan Kas (Opsional) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hubungkan dengan Kas Pengeluaran (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.cash_reference}
                    onChange={(e) => setFormData({ ...formData, cash_reference: e.target.value })}
                    placeholder="Contoh: BKK-088-2026 (Rp 450.000 - Belanja Pipa &amp; Lem)"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Memudahkan warga &amp; BPD mencocokkan nota belanja kas dengan hasil fisik di lapangan.
                  </span>
                </div>

                {/* Toggle Before / After */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.has_before_after}
                      onChange={(e) => setFormData({ ...formData, has_before_after: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                    />
                    <span className="font-bold text-slate-800 text-xs">
                      Sertakan Foto Sebelum &amp; Sesudah (Before &amp; After)
                    </span>
                  </label>
                </div>

                {formData.has_before_after ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <label className="block font-bold text-rose-800 mb-1">
                        URL Foto SEBELUM Dikerjakan
                      </label>
                      <input
                        type="url"
                        value={formData.before_image_url}
                        onChange={(e) => setFormData({ ...formData, before_image_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-emerald-800 mb-1">
                        URL Foto SESUDAH Selesai
                      </label>
                      <input
                        type="url"
                        value={formData.after_image_url}
                        onChange={(e) => setFormData({ ...formData, after_image_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      URL Foto Kegiatan Lapangan
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Deskripsi */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Deskripsi Ringkasan Hasil Pengerjaan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Jelaskan kondisi sebelum diperbaiki, tindakan teknis yang diambil, material yang dipakai, dan hasil aliran air ke rumah warga..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={isSubmitting}
                    icon={isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold"
                  >
                    {isSubmitting ? "Menyimpan..." : "Publikasikan Dokumentasi"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lightbox Layar Penuh Modal */}
        {lightboxItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-6"
            onClick={() => setLightboxItem(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[94vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-slate-800 text-white">
                <div className="flex items-center space-x-2 truncate">
                  {getCategoryBadge(lightboxItem.category)}
                  <span className="text-xs font-bold text-slate-300 truncate">Dusun {lightboxItem.dusun}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxItem(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Image */}
              <div className="relative h-80 sm:h-[460px] w-full bg-black">
                <Image
                  src={
                    lightboxItem.has_before_after && lightboxMode === "before" && lightboxItem.before_image_url
                      ? lightboxItem.before_image_url
                      : lightboxItem.after_image_url || lightboxItem.image_url
                  }
                  alt={lightboxItem.title}
                  fill
                  unoptimized
                  className="object-contain"
                />

                {/* Before / After switch in Lightbox */}
                {lightboxItem.has_before_after && lightboxItem.before_image_url && (
                  <div className="absolute top-4 left-4 flex items-center bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 text-xs font-extrabold text-white shadow-xl space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setLightboxMode("before")}
                      className={`px-3 py-1 rounded-xl transition ${
                        lightboxMode === "before" ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Sebelum Pengerjaan
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxMode("after")}
                      className={`px-3 py-1 rounded-xl transition ${
                        lightboxMode === "after" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Setelah Selesai
                    </button>
                  </div>
                )}
              </div>

              {/* Lightbox Details Info */}
              <div className="p-5 bg-slate-950 text-white space-y-3 overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">{lightboxItem.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      📅 {formatDateIndo(lightboxItem.activity_date)} &bull; 👤 Pelaksana: {lightboxItem.person_in_charge}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleShareWa(lightboxItem)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Bagikan ke WhatsApp Dusun</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {lightboxItem.description}
                </p>

                {lightboxItem.cash_reference && (
                  <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs text-amber-200">
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <span>Alokasi Kas Riil Terkait: <strong>{lightboxItem.cash_reference}</strong></span>
                    </div>
                    <Link
                      href="/dashboard/keuangan"
                      className="text-amber-400 hover:text-amber-300 font-bold underline text-xs"
                    >
                      Buka Rincian Kas
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
