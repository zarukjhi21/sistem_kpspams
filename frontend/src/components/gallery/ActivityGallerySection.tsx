"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  MapPin,
  Calendar,
  User,
  Wrench,
  Mountain,
  Droplet,
  Users,
  Search,
  ExternalLink,
  X,
  Share2,
  ChevronRight,
  Filter,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getApiBaseUrl } from "@/lib/api-client";

export interface ActivityDocItem {
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
}

const FALLBACK_DOCUMENTATIONS: ActivityDocItem[] = [
  {
    id: 1,
    title: "Penggantian Pipa Distribusi PVC 2 Inch Retak",
    category: "PERBAIKAN_PIPA",
    dusun: "Lemo Baru",
    activity_date: "2026-10-28",
    person_in_charge: "Sabir & Tim Teknisi",
    description: "Pipa distribusi tersumbat batu dan retak di dekat jembatan dusun telah selesai disambung kembali dengan pipa PVC tebal SNI. Aliran gravitasi ke 32 rumah warga kini kembali lancar bertekanan stabil.",
    cash_reference: "BKK-088-2026 (Rp 450.000)",
    image_url: "/gallery/perbaikan-pipa.jpg",
    before_image_url: "/gallery/pipa-retak-sebelum.jpg",
    after_image_url: "/gallery/perbaikan-pipa.jpg",
    has_before_after: true,
  },
  {
    id: 2,
    title: "Pembersihan Bak Intake & Sedimentasi Mata Air Pegunungan",
    category: "PERAWATAN_INTAKE",
    dusun: "Lemo Baru",
    activity_date: "2026-10-24",
    person_in_charge: "Pengurus & Warga (Kerja Bakti)",
    description: "Pembersihan rutin bak penangkap air (intake gravitasi) di hulu bukit Dusun Lemo Baru. Pembuangan endapan lumpur, pasir halus, dan daun kering guna memastikan kejernihan air tetap prima menjelang musim penghujan.",
    cash_reference: "BKK-082-2026 (Rp 180.000 - Konsumsi)",
    image_url: "/gallery/intake-mata-air.jpg",
    before_image_url: "/gallery/intake-kotor-sebelum.jpg",
    after_image_url: "/gallery/intake-mata-air.jpg",
    has_before_after: true,
  },
  {
    id: 3,
    title: "Pemasangan Sambungan Rumah (SR) Baru & Kalibrasi Meteran",
    category: "PASANG_BARU",
    dusun: "Lemo Baru",
    activity_date: "2026-10-20",
    person_in_charge: "Tim Teknis KPSPAMS",
    description: "Pemasangan 1 unit Sambungan Rumah (SR) baru lengkap dengan pelat barcode resmi, stop kran ball valve kuningan, dan meteran air jarum presisi di rumah warga RT 02 Dusun Lemo Baru.",
    cash_reference: "BKK-079-2026 (Rp 320.000 - Fitting & Kran)",
    image_url: "/gallery/pasang-sr-meteran.jpg",
    before_image_url: null,
    after_image_url: null,
    has_before_after: false,
  },
  {
    id: 4,
    title: "Musyawarah Warga Penetapan Iuran & Rekonsiliasi Kas Bersama BPD",
    category: "MUSYAWARAH",
    dusun: "Lemo Baru",
    activity_date: "2026-10-15",
    person_in_charge: "Kepala Desa, Ketua BPD, & Pengurus",
    description: "Musyawarah penetapan kepengurusan baru KPSPAMS masa bakti 2026-2029 dan penetapan transparansi buku kas operasional. Dihadiri oleh Kepala Desa Kuajang (H. Muhammad S.), Ketua BPD (Tabih T.), dan tokoh masyarakat.",
    cash_reference: "BKK-074-2026 (Rp 250.000 - Konsumsi)",
    image_url: "/gallery/musyawarah-desa.jpg",
    before_image_url: null,
    after_image_url: null,
    has_before_after: false,
  },
  {
    id: 5,
    title: "Pengecekan Tekanan & Penggantian Jarum Meteran Macet",
    category: "UJI_KUALITAS",
    dusun: "Lemo Tua",
    activity_date: "2026-10-10",
    person_in_charge: "Petugas Monitoring Lapangan",
    description: "Pemeriksaan fisik meteran warga yang mengalami kendala jarum macet di Dusun Lemo Tua. Petugas melakukan pengetesan debit alir dan mencatat stand fisik riil agar tagihan warga tetap adil dan akurat.",
    cash_reference: "BKK-069-2026 (Rp 150.000)",
    image_url: "/gallery/uji-meteran.jpg",
    before_image_url: null,
    after_image_url: null,
    has_before_after: false,
  },
  {
    id: 6,
    title: "Perbaikan Jalur Pipa Distribusi Utama yang Tertimbun Longsor",
    category: "PERBAIKAN_PIPA",
    dusun: "Sarampu",
    activity_date: "2026-10-05",
    person_in_charge: "Teknisi Sarampu & Gotong Royong Warga",
    description: "Penggalian dan pergeseran jalur pipa HDPE 1.5 inch yang tertimpa reruntuhan tanah tebing di perbatasan Dusun Sarampu. Telah dipasangi klem pelindung beton untuk mencegah risiko tertekan batu.",
    cash_reference: "BKK-063-2026 (Rp 550.000 - Pipa & Semen)",
    image_url: "/gallery/pipa-longsor.jpg",
    before_image_url: null,
    after_image_url: null,
    has_before_after: false,
  },
];

interface ActivityGallerySectionProps {
  showTitle?: boolean;
  limit?: number;
  initialKpspamsId?: number | null;
  enableUploadButton?: boolean;
}

export function ActivityGallerySection({
  showTitle = true,
  limit,
  initialKpspamsId,
  enableUploadButton = false,
}: ActivityGallerySectionProps) {
  const [items, setItems] = useState<ActivityDocItem[]>(FALLBACK_DOCUMENTATIONS);
  const [selectedDusun, setSelectedDusun] = useState<string>("Semua Dusun");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeItem, setActiveItem] = useState<ActivityDocItem | null>(null);
  const [lightboxMode, setLightboxMode] = useState<"after" | "before">("after");
  const [cardToggleState, setCardToggleState] = useState<Record<number, "after" | "before">>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchDocs() {
      setIsLoading(true);
      try {
        const baseUrl = getApiBaseUrl();
        const url = new URL(`${baseUrl}/documentations`);
        if (initialKpspamsId) {
          url.searchParams.set("kpspams_id", String(initialKpspamsId));
        }
        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          if (json.status === "success" && Array.isArray(json.data) && json.data.length > 0) {
            setItems(json.data);
          }
        }
      } catch (err) {
        console.warn("ActivityGallery: using fallback documentations", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocs();
  }, [initialKpspamsId]);

  const categories = [
    { key: "ALL", label: "Semua Kategori", icon: Sparkles },
    { key: "PERBAIKAN_PIPA", label: "🛠️ Perbaikan Pipa", icon: Wrench },
    { key: "PERAWATAN_INTAKE", label: "🏞️ Perawatan Intake & Sumber", icon: Mountain },
    { key: "PASANG_BARU", label: "💧 Pasang SR Baru", icon: Droplet },
    { key: "MUSYAWARAH", label: "👥 Musyawarah & Rapat", icon: Users },
    { key: "UJI_KUALITAS", label: "🔍 Uji Fisik & Meteran", icon: Search },
  ];

  const dusunList = ["Semua Dusun", "Lemo Baru", "Lemo Tua", "Sarampu"];

  const filteredItems = items.filter((item) => {
    const matchDusun = selectedDusun === "Semua Dusun" || item.dusun === selectedDusun;
    const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchDusun && matchCat;
  });

  const displayedItems = limit ? filteredItems.slice(0, limit) : filteredItems;

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
        return <Badge variant="brand" size="sm">Perbaikan Pipa</Badge>;
      case "PERAWATAN_INTAKE":
        return <Badge variant="success" size="sm">Intake &amp; Mata Air</Badge>;
      case "PASANG_BARU":
        return <Badge variant="info" size="sm">Pasang SR Baru</Badge>;
      case "MUSYAWARAH":
        return <Badge variant="neutral" size="sm">Musyawarah Warga</Badge>;
      case "UJI_KUALITAS":
        return <Badge variant="warning" size="sm">Uji Fisik &amp; Meteran</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{cat}</Badge>;
    }
  };

  const handleShareWa = (item: ActivityDocItem) => {
    const text = `*DOKUMENTASI KEGIATAN KPSPAMS DESA KUAJANG*\n` +
      `*${item.title}*\n` +
      `Wilayah: Dusun ${item.dusun} • Tanggal: ${formatDateIndo(item.activity_date)}\n` +
      `Pelaksana: ${item.person_in_charge}\n\n` +
      `"${item.description}"\n\n` +
      `Lihat dokumentasi selengkapnya di: https://sikpspams-kuajang.pages.dev`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section id="dokumentasi-kegiatan" className="space-y-6 sm:space-y-8 scroll-mt-20">
      {showTitle && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200/80 mb-2">
              <Camera className="w-3.5 h-3.5 text-sky-600" />
              <span>Bukti Fisik Transparansi Lapangan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dokumentasi Kegiatan &amp; Perawatan Jaringan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Bukti nyata kerja operasional pengurus KPSPAMS Desa Kuajang dalam merawat mata air gravitasi, memperbaiki pipa distribusi, dan melayani sambungan rumah warga.
            </p>
          </div>

          {enableUploadButton && (
            <Link
              href="/dashboard/dokumentasi"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition active:scale-95 whitespace-nowrap"
            >
              <Camera className="w-4 h-4 text-sky-400" />
              <span>Kelola Galeri &amp; Upload Foto</span>
            </Link>
          )}
        </div>
      )}

      {/* Filter Tabs: Dusun & Kategori */}
      <div className="space-y-3">
        {/* Filter Dusun */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Wilayah:
          </span>
          {dusunList.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDusun(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                selectedDusun === d
                  ? "bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Filter Kategori Tematik */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelectedCategory(c.key)}
              className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition border whitespace-nowrap flex items-center space-x-1.5 ${
                selectedCategory === c.key
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Kartu Dokumentasi Modern (Responsive Card Grid) */}
      {displayedItems.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-white border border-slate-200 text-slate-400 text-xs">
          <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-600">Belum ada dokumentasi untuk filter yang dipilih.</p>
          <p className="text-slate-400 mt-0.5">Pilih Dusun atau Kategori lain untuk melihat kegiatan lapangan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {displayedItems.map((item) => {
            const toggleState = cardToggleState[item.id] || "after";
            const currentImg =
              item.has_before_after && toggleState === "before" && item.before_image_url
                ? item.before_image_url
                : item.has_before_after && toggleState === "after" && item.after_image_url
                ? item.after_image_url
                : item.image_url;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Visual Image Header */}
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden cursor-pointer">
                  <Image
                    src={currentImg}
                    alt={item.title}
                    width={600}
                    height={375}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onClick={() => {
                      setActiveItem(item);
                      setLightboxMode(toggleState);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1">
                    <div className="flex items-center space-x-1.5">
                      {getCategoryBadge(item.category)}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                        {item.dusun}
                      </span>
                    </div>

                    {item.has_before_after && (
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wider shadow">
                        Sebelum &amp; Sesudah
                      </span>
                    )}
                  </div>

                  {/* Before / After Toggle Buttons on Card */}
                  {item.has_before_after && item.before_image_url && item.after_image_url && (
                    <div className="absolute bottom-2.5 right-2.5 flex items-center rounded-xl bg-slate-950/85 backdrop-blur-md p-0.5 border border-white/20 shadow-md">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardToggleState((prev) => ({ ...prev, [item.id]: "before" }));
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                          toggleState === "before"
                            ? "bg-amber-500 text-slate-950 shadow-xs"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        Sebelum
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardToggleState((prev) => ({ ...prev, [item.id]: "after" }));
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                          toggleState === "after"
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        Sesudah
                      </button>
                    </div>
                  )}

                  {/* Bottom Metas on Image */}
                  <div className="absolute bottom-2.5 left-3 text-white text-[11px] font-medium flex items-center space-x-2">
                    <span className="flex items-center space-x-1 text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>{formatDateIndo(item.activity_date)}</span>
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h3
                      onClick={() => {
                        setActiveItem(item);
                        setLightboxMode(toggleState);
                      }}
                      className="text-sm sm:text-base font-black text-slate-900 leading-snug group-hover:text-sky-600 transition cursor-pointer"
                    >
                      {item.title}
                    </h3>

                    <div className="flex items-center text-[11px] text-slate-500 space-x-1 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">Pelaksana: <strong className="text-slate-700">{item.person_in_charge}</strong></span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Footer Card: Details & Action Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Dokumentasi Lapangan
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveItem(item);
                        setLightboxMode(toggleState);
                      }}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-sky-50 transition"
                    >
                      <span>Lihat Rincian</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Lightbox Layar Penuh (HD View & Detail Narasi) */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                {getCategoryBadge(activeItem.category)}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  Dusun {activeItem.dusun}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Photo Area */}
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
                <Image
                  src={
                    activeItem.has_before_after && lightboxMode === "before" && activeItem.before_image_url
                      ? activeItem.before_image_url
                      : activeItem.has_before_after && lightboxMode === "after" && activeItem.after_image_url
                      ? activeItem.after_image_url
                      : activeItem.image_url
                  }
                  alt={activeItem.title}
                  width={1200}
                  height={750}
                  className="w-full h-full object-cover"
                />

                {/* Before / After Switcher in Modal */}
                {activeItem.has_before_after && activeItem.before_image_url && activeItem.after_image_url && (
                  <div className="absolute top-3 right-3 flex items-center rounded-xl bg-slate-950/85 backdrop-blur-md p-1 border border-white/20 shadow-lg">
                    <button
                      type="button"
                      onClick={() => setLightboxMode("before")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        lightboxMode === "before"
                          ? "bg-amber-500 text-slate-950 shadow"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Kondisi Sebelum
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxMode("after")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        lightboxMode === "after"
                          ? "bg-emerald-500 text-white shadow"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Kondisi Sesudah
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {activeItem.title}
                </h3>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>{formatDateIndo(activeItem.activity_date)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pelaksana: <strong className="text-slate-700">{activeItem.person_in_charge}</strong></span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dusun {activeItem.dusun}</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  Laporan Hasil Kegiatan Lapangan:
                </span>
                <p>{activeItem.description}</p>
              </div>
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => handleShareWa(activeItem)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan ke WhatsApp Warga</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
