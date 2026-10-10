"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Layers,
  Satellite,
  Compass,
  Droplets,
  Mountain,
  ShieldCheck,
  Search,
  X,
  Sparkles,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Maximize2,
  Minimize2,
  Filter,
  Phone,
  MessageCircle,
  Wrench,
  AlertTriangle,
  Info,
  Sliders,
  ChevronRight,
  TrendingDown,
  Gauge,
  Workflow,
  Check,
  Copy,
} from "lucide-react";
import L from "leaflet";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

import {
  MasterGisCustomer,
  ReservoirSourceItem,
  VILLAGE_RESERVOIRS,
  MAIN_TRANSMISSION_PIPELINE,
  VILLAGE_DISTRIBUTION_PIPELINE,
} from "@/types/gis";

interface MasterDesaGisMapProps {
  customers: MasterGisCustomer[];
  reservoirs?: ReservoirSourceItem[];
  selectedCustomerId?: number | null;
  onSelectCustomer?: (customer: MasterGisCustomer) => void;
  onSelectReservoir?: (reservoir: ReservoirSourceItem) => void;
}

export function MasterDesaGisMap({
  customers,
  reservoirs = VILLAGE_RESERVOIRS,
  selectedCustomerId,
  onSelectCustomer,
  onSelectReservoir,
}: MasterDesaGisMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pipelineLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // States
  const [mapType, setMapType] = useState<"google-hybrid" | "google-streets" | "esri-topo">(
    "google-hybrid"
  );
  const [filterLayer, setFilterLayer] = useState<
    "ALL" | "PAID" | "UNPAID" | "COMPLAINT" | "RESERVOIR"
  >("ALL");
  const [filterDusun, setFilterDusun] = useState<string>("ALL");
  const [showPipelines, setShowPipelines] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeItem, setActiveItem] = useState<{
    type: "CUSTOMER" | "RESERVOIR";
    customer?: MasterGisCustomer;
    reservoir?: ReservoirSourceItem;
  } | null>(null);
  const [showPressureAnalysis, setShowPressureAnalysis] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Dusun list from customers
  const dusunList = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.dusun) set.add(c.dusun);
    });
    return Array.from(set);
  }, [customers]);

  // Evaluasi Spasial Tekanan & Gangguan Geografis
  const spatialMetrics = useMemo(() => {
    const totalCustomers = customers.length;
    const paidCount = customers.filter(
      (c) => c.billingStatus === "PAID" && !c.activeComplaint
    ).length;
    const unpaidCount = customers.filter(
      (c) => c.billingStatus === "UNPAID" && !c.activeComplaint
    ).length;
    const complaintCount = customers.filter((c) => !!c.activeComplaint).length;
    const totalReservoirs = reservoirs.length;
    const totalCapacity = reservoirs.reduce((acc, r) => acc + r.capacityLiters, 0);

    // Hitung keluhan per dusun
    const complaintsByDusun: Record<string, number> = {};
    customers.forEach((c) => {
      if (c.activeComplaint) {
        complaintsByDusun[c.dusun] = (complaintsByDusun[c.dusun] || 0) + 1;
      }
    });

    return {
      totalCustomers,
      paidCount,
      unpaidCount,
      complaintCount,
      totalReservoirs,
      totalCapacity,
      complaintsByDusun,
    };
  }, [customers, reservoirs]);

  // Filter Data yang ditampilkan di Peta
  const filteredData = useMemo(() => {
    let custs = customers.filter((c) => {
      if (filterDusun !== "ALL" && c.dusun !== filterDusun) return false;

      if (filterLayer === "PAID") {
        return c.billingStatus === "PAID" && !c.activeComplaint;
      }
      if (filterLayer === "UNPAID") {
        return c.billingStatus === "UNPAID" && !c.activeComplaint;
      }
      if (filterLayer === "COMPLAINT") {
        return !!c.activeComplaint;
      }
      if (filterLayer === "RESERVOIR") {
        return false; // Sembunyikan pelanggan jika hanya reservoir
      }
      return true;
    });

    let resvs = reservoirs;
    if (filterLayer === "PAID" || filterLayer === "UNPAID" || filterLayer === "COMPLAINT") {
      resvs = []; // Sembunyikan reservoir jika filter spesifik pelanggan
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      custs = custs.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.connectionNo.toLowerCase().includes(q) ||
          c.dusun.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.activeComplaint?.ticketNumber &&
            c.activeComplaint.ticketNumber.toLowerCase().includes(q))
      );
      resvs = resvs.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.typeLabel.toLowerCase().includes(q) ||
          r.dusunServed.toLowerCase().includes(q)
      );
    }

    return { customers: custs, reservoirs: resvs };
  }, [customers, reservoirs, filterLayer, filterDusun, searchQuery]);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Titik Tengah Desa Kuajang / Lemo Baru (Antara Mata Air Pegunungan & Balai Desa)
    const initialCenterLat = -3.4275;
    const initialCenterLng = 119.3768;

    const map = L.map(mapContainerRef.current, {
      center: [initialCenterLat, initialCenterLng],
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    // Zoom control kanan atas
    L.control.zoom({ position: "topright" }).addTo(map);

    // Google Hybrid Tile (Satelit Tajam + Nama Jalan & Tempat)
    const tileLayer = L.tileLayer("https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["0", "1", "2", "3"],
      attribution: "&copy; Google Maps Satelit • Desa Kuajang",
      updateWhenIdle: false,
      keepBuffer: 6,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Pipeline Layer
    const pipelineLayer = L.layerGroup().addTo(map);
    pipelineLayerRef.current = pipelineLayer;

    // Markers Layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    // Redraw fix
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Jalur Pipa
  useEffect(() => {
    if (!mapInstanceRef.current || !pipelineLayerRef.current) return;
    const pLayer = pipelineLayerRef.current;
    pLayer.clearLayers();

    if (!showPipelines) return;

    // 1. Pipa Transmisi Utama Gravitasi (Cyan Glow Dashed Line)
    const mainPipe = L.polyline(MAIN_TRANSMISSION_PIPELINE, {
      color: "#06b6d4",
      weight: 5,
      opacity: 0.9,
      dashArray: "10, 8",
      lineJoin: "round",
    });

    mainPipe.bindTooltip(
      `
      <div style="font-size: 11px; line-height: 1.3;">
        <strong style="color: #06b6d4;">Pipa Transmisi Utama Gravitasi (Ø 3" HDPE)</strong><br/>
        <span>Hulu Broncaptering (145m dpl) &rarr; Bak Pelepas Tekanan (95m dpl)</span><br/>
        <span style="color: #67e8f9; font-size: 10px;">Debit Aliran: 4.8 L/detik • Tanpa Pompa Listrik</span>
      </div>
    `,
      { className: "gis-custom-tooltip", sticky: true }
    );
    pLayer.addLayer(mainPipe);

    // 2. Pipa Distribusi Dusun Pemukiman (Deep Sky Blue Solid)
    const distPipe = L.polyline(VILLAGE_DISTRIBUTION_PIPELINE, {
      color: "#0284c7",
      weight: 3.5,
      opacity: 0.85,
      lineJoin: "round",
    });

    distPipe.bindTooltip(
      `
      <div style="font-size: 11px; line-height: 1.3;">
        <strong style="color: #38bdf8;">Pipa Distribusi Dusun Lemo Baru (Ø 2" PVC SNI)</strong><br/>
        <span>Melayani 37+ Titik Sambungan Rumah (SR) Warga</span>
      </div>
    `,
      { className: "gis-custom-tooltip", sticky: true }
    );
    pLayer.addLayer(distPipe);
  }, [showPipelines]);

  // Render Marker Pins di Peta dengan 4 Warna Sesuai Permintaan
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const mLayer = markersLayerRef.current;
    mLayer.clearLayers();

    // 1. 🔵 PIN BIRU: Lokasi Bak Penampungan Air (Reservoir / Intake / Sumber)
    filteredData.reservoirs.forEach((resv) => {
      const isSelected = activeItem?.type === "RESERVOIR" && activeItem.reservoir?.id === resv.id;
      const isIntake = resv.type === "INTAKE";

      const reservoirIcon = L.divIcon({
        className: "gis-reservoir-pin",
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              inset: -6px;
              border-radius: 50%;
              background: rgba(2, 132, 199, 0.35);
              animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 38px;
              height: 38px;
              background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
              border: 3px solid ${isSelected ? "#fef08a" : "#ffffff"};
              border-radius: 50%;
              box-shadow: 0 6px 18px rgba(2, 132, 199, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: transform 0.2s;
            ">
              <span style="font-size: 18px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">
                ${isIntake ? "🏔️" : "🛢️"}
              </span>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([resv.latitude, resv.longitude], {
        icon: reservoirIcon,
        zIndexOffset: 500,
      });

      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px;">
          <strong style="color: #38bdf8; font-size: 12px;">🔵 ${resv.name}</strong><br/>
          <span>${resv.typeLabel} • Elevasi ${resv.elevationM} mdpl</span><br/>
          <span style="color: #bae6fd;">Kapasitas: ${resv.capacityLiters.toLocaleString("id-ID")} Liter</span>
        </div>
      `,
        { direction: "top", className: "gis-custom-tooltip" }
      );

      marker.on("click", () => {
        setActiveItem({ type: "RESERVOIR", reservoir: resv });
        onSelectReservoir?.(resv);
        mapInstanceRef.current?.setView([resv.latitude, resv.longitude], 17, { animate: true });
      });

      mLayer.addLayer(marker);
    });

    // 2. PIN PELANGGAN (🟢 Hijau = Lunas, 🔴 Merah = Belum Lunas/Menunggak, 🟡 Kuning = Pengaduan Gangguan)
    filteredData.customers.forEach((cust) => {
      const isSelected = activeItem?.type === "CUSTOMER" && activeItem.customer?.id === cust.id;

      // Logika Penentuan Warna Pin
      let pinColor = "#10b981"; // 🟢 Default: Hijau (Lunas)
      let pinType: "PAID" | "UNPAID" | "COMPLAINT" = "PAID";
      let pinSymbol = "✓";
      let pulseRing = "";

      if (cust.activeComplaint) {
        // 🟡 Pin Kuning: Sedang Mengajukan Pengaduan Gangguan (Pipa Bocor / Air Mati / Tekanan Rendah)
        pinColor = "#f59e0b";
        pinType = "COMPLAINT";
        pinSymbol = cust.activeComplaint.category === "PIPA_BOCOR" ? "🔧" : "⚠️";
        pulseRing = `
          <div style="
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            background: rgba(245, 158, 11, 0.5);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        `;
      } else if (cust.billingStatus === "UNPAID") {
        // 🔴 Pin Merah: Ada Tunggakan / Belum Lunas
        pinColor = "#ef4444";
        pinType = "UNPAID";
        pinSymbol = "Rp";
      }

      const customerIcon = L.divIcon({
        className: `gis-pin-${pinType.toLowerCase()}`,
        html: `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            ${pulseRing}
            ${
              isSelected
                ? `<div style="position: absolute; inset: -4px; border-radius: 50%; border: 3px solid #fef08a; animation: ping 1.2s infinite;"></div>`
                : ""
            }
            <div style="
              width: 30px;
              height: 30px;
              background: ${pinColor};
              border: 2.5px solid ${isSelected ? "#fef08a" : "#ffffff"};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <div style="
                transform: rotate(45deg);
                color: #ffffff;
                font-size: ${pinType === "COMPLAINT" ? "12px" : "11px"};
                font-weight: 900;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                ${pinSymbol}
              </div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 30],
      });

      const marker = L.marker([cust.latitude, cust.longitude], {
        icon: customerIcon,
        zIndexOffset: pinType === "COMPLAINT" ? 300 : pinType === "UNPAID" ? 200 : 100,
      });

      const statusBadgeText =
        pinType === "COMPLAINT"
          ? `🟡 Gangguan: ${cust.activeComplaint?.category.replace(/_/g, " ")}`
          : pinType === "UNPAID"
          ? "🔴 Ada Tunggakan (Belum Lunas)"
          : "🟢 Tagihan Lunas";

      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px;">
          <strong style="color: #f8fafc; font-size: 12px;">${cust.name}</strong><br/>
          <span style="font-family: monospace; color: #94a3b8;">${cust.connectionNo} • ${cust.dusun}</span><br/>
          <span style="font-weight: 700; color: ${
            pinType === "COMPLAINT" ? "#fcd34d" : pinType === "UNPAID" ? "#fca5a5" : "#6ee7b7"
          };">
            ${statusBadgeText}
          </span>
        </div>
      `,
        { direction: "top", className: "gis-custom-tooltip" }
      );

      marker.on("click", () => {
        setActiveItem({ type: "CUSTOMER", customer: cust });
        onSelectCustomer?.(cust);
        mapInstanceRef.current?.setView([cust.latitude, cust.longitude], 18, { animate: true });
      });

      mLayer.addLayer(marker);
    });
  }, [filteredData, activeItem, onSelectCustomer, onSelectReservoir]);

  // Center ke item yang dipilih dari luar
  useEffect(() => {
    if (selectedCustomerId && customers.length > 0) {
      const match = customers.find((c) => c.id === selectedCustomerId);
      if (match && mapInstanceRef.current) {
        setActiveItem({ type: "CUSTOMER", customer: match });
        mapInstanceRef.current.setView([match.latitude, match.longitude], 18, { animate: true });
      }
    }
  }, [selectedCustomerId, customers]);

  // Switch Base Map Tiles
  const switchMapType = (type: "google-hybrid" | "google-streets" | "esri-topo") => {
    setMapType(type);
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.remove();

    let url = "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    let attr = "&copy; Google Maps Satelit";
    let maxZoom = 20;

    if (type === "google-streets") {
      url = "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
      attr = "&copy; Google Maps Streets";
    } else if (type === "esri-topo") {
      url =
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
      attr = "&copy; Esri &mdash; Topo Map & Relief Bukit";
      maxZoom = 18;
    }

    const newLayer = L.tileLayer(url, {
      maxZoom,
      subdomains: ["0", "1", "2", "3"],
      attribution: attr,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  };

  // Fullscreen Handler
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
  };

  // Kirim WhatsApp Pengingat Tagihan
  const handleSendCustomerWa = (cust: MasterGisCustomer) => {
    if (!cust.phone) {
      alert(`Nomor WhatsApp untuk ${cust.name} belum terdaftar.`);
      return;
    }
    const cleanPhone = cust.phone.replace(/^0/, "62").replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Yth. Bpk/Ibu ${cust.name}, tagihan air bersih ${cust.kpspamsName || "KPSPAMS Lemo Baru"} ` +
        `periode Oktober 2026 sebesar Rp 10.000,- telah terbit. Jatuh tempo: 20 Oktober. ` +
        `Cek rincian di: sikpspams-kuajang.pages.dev/portal?sr=${cust.connectionNo}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  // Hubungi Petugas Mengenai Pengaduan Gangguan
  const handleContactCustomerIssue = (cust: MasterGisCustomer) => {
    if (!cust.phone) {
      alert(`Nomor kontak untuk ${cust.name} belum terdaftar.`);
      return;
    }
    const cleanPhone = cust.phone.replace(/^0/, "62").replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Yth. Bpk/Ibu ${cust.name}, menindaklanjuti laporan gangguan air Anda (${cust.activeComplaint?.ticketNumber} - ${cust.activeComplaint?.category.replace(/_/g, " ")}), tim teknisi KPSPAMS sedang bergerak memeriksa titik pipa di sekitar rumah Anda.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] w-screen h-screen bg-slate-950 p-2 sm:p-4 flex flex-col overflow-hidden"
          : "space-y-4"
      }
    >
      {/* Top Controls Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-3xl text-white shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Legend 4 Warna Wajib */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-brand-gold-400" />
              <span>Indikator Spasial:</span>
            </span>

            {/* 🟢 Pin Hijau: Lunas */}
            <button
              type="button"
              onClick={() => setFilterLayer(filterLayer === "PAID" ? "ALL" : "PAID")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterLayer === "PAID"
                  ? "bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-900/40"
                  : "bg-slate-800/90 border-slate-700/80 text-emerald-300 hover:bg-slate-800"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>🟢 Lunas ({spatialMetrics.paidCount})</span>
            </button>

            {/* 🔴 Pin Merah: Belum Lunas */}
            <button
              type="button"
              onClick={() => setFilterLayer(filterLayer === "UNPAID" ? "ALL" : "UNPAID")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterLayer === "UNPAID"
                  ? "bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-900/40"
                  : "bg-slate-800/90 border-slate-700/80 text-rose-300 hover:bg-slate-800"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span>🔴 Tunggakan ({spatialMetrics.unpaidCount})</span>
            </button>

            {/* 🟡 Pin Kuning: Pengaduan Gangguan */}
            <button
              type="button"
              onClick={() => setFilterLayer(filterLayer === "COMPLAINT" ? "ALL" : "COMPLAINT")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterLayer === "COMPLAINT"
                  ? "bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-900/40"
                  : "bg-slate-800/90 border-slate-700/80 text-amber-300 hover:bg-slate-800"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>🟡 Gangguan Air ({spatialMetrics.complaintCount})</span>
            </button>

            {/* 🔵 Pin Biru: Reservoir / Intake */}
            <button
              type="button"
              onClick={() => setFilterLayer(filterLayer === "RESERVOIR" ? "ALL" : "RESERVOIR")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterLayer === "RESERVOIR"
                  ? "bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-900/40"
                  : "bg-slate-800/90 border-slate-700/80 text-sky-300 hover:bg-slate-800"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              <span>🔵 Bak & Reservoir ({spatialMetrics.totalReservoirs})</span>
            </button>
          </div>

          {/* Action Buttons: Analisis Tekanan, Jalur Pipa, Base Map, Fullscreen */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Evaluasi Tekanan & Gangguan (Khusus Kades & Pengurus) */}
            <button
              type="button"
              onClick={() => setShowPressureAnalysis(!showPressureAnalysis)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                showPressureAnalysis
                  ? "bg-brand-maroon-700 text-brand-gold-300 border-brand-gold-400 shadow-md"
                  : "bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700"
              }`}
              title="Buka panel evaluasi teknis tekanan air & analisis elevasi geografis"
            >
              <Gauge className="w-3.5 h-3.5 text-brand-gold-400" />
              <span>Evaluasi Tekanan & Elevasi</span>
            </button>

            {/* Toggle Jalur Pipa Transmisi */}
            <button
              type="button"
              onClick={() => setShowPipelines(!showPipelines)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                showPipelines
                  ? "bg-cyan-900/50 text-cyan-200 border-cyan-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700 line-through"
              }`}
              title="Tampilkan / Sembunyikan garis jaringan pipa air desa"
            >
              <Workflow className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pipa Jaringan</span>
            </button>

            {/* Base Map Switcher */}
            <div className="inline-flex rounded-xl bg-slate-800 p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => switchMapType("google-hybrid")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  mapType === "google-hybrid"
                    ? "bg-brand-maroon-800 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Peta Satelit Tajam Google dengan Label Jalan"
              >
                Satelit
              </button>
              <button
                type="button"
                onClick={() => switchMapType("esri-topo")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  mapType === "esri-topo"
                    ? "bg-brand-maroon-800 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Peta Kontur & Ketinggian Bukit Esri Topo"
              >
                Kontur Topo
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title={isFullscreen ? "Keluar dari Layar Penuh (Esc)" : "Mode Presentasi Layar Penuh"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filter Bar: Dusun Selector & Search Box */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama warga, nomor SR, atau dusun..."
              className="w-full pl-10 pr-8 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-gold-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end text-xs">
            <span className="text-slate-400 font-bold flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>Wilayah Dusun:</span>
            </span>
            <select
              value={filterDusun}
              onChange={(e) => setFilterDusun(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-brand-gold-400"
            >
              <option value="ALL">Semua Dusun ({customers.length} SR)</option>
              {dusunList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Panel Evaluasi Tekanan & Geografis (Khusus Kepala Desa & Ketua KPSPAMS) */}
      {showPressureAnalysis && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-maroon-950 to-slate-900 text-white border border-brand-gold-500/40 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-brand-gold-400/20 text-brand-gold-300 text-[11px] font-bold border border-brand-gold-400/30">
                <Sparkles className="w-3 h-3 text-brand-gold-400" />
                <span>Panel Analisis Geografis Khusus Kepala Desa & Pengurus KPSPAMS</span>
              </div>
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-cyan-400" />
                <span>Evaluasi Tekanan Hidrostatik & Sebaran Kerawanan Pipa</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowPressureAnalysis(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Card 1: Profil Elevasi Gravitasi */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="font-extrabold text-cyan-300 flex items-center space-x-1.5">
                <Mountain className="w-4 h-4" />
                <span>Profil Beda Tinggi (Head Aliran)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Hulu mata air berada pada elevasi <strong>145 mdpl</strong>, turun ke Bak Pelepas
                Tekanan (<strong>95 mdpl</strong>), lalu menyuplai pemukiman hilir (<strong>55 - 65 mdpl</strong>).
              </p>
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-[10px] text-cyan-200">
                ✓ Beda tinggi efektif: <strong>80 meter</strong> (~8 bar alami). Telah diredam aman
                oleh BPT sebelum mencapai meteran warga.
              </div>
            </div>

            {/* Card 2: Deteksi Klaster Tekanan Kritis */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="font-extrabold text-amber-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Evaluasi Wilayah Tekanan Rendah</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Terdeteksi <strong>{spatialMetrics.complaintCount} titik gangguan aktif</strong>.
                Wilayah rawan tekanan rendah berada di <strong>ujung pipa hilir Dusun Lemo Baru</strong> saat
                jam beban puncak (06:00-08:00 dan 17:00-19:00).
              </p>
              <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/50 text-[10px] text-amber-200">
                ⚠ Titik kritis: SR-LMB-00043 (Bpk Abdul Majid) &amp; SR-LMB-00016 (Bpk Harman).
              </div>
            </div>

            {/* Card 3: Rekomendasi Solusi Teknis Pemerintah Desa */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="font-extrabold text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Rekomendasi Tindakan Operasional</span>
              </div>
              <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                <li>Lakukan flushing lumpur dan pasir di bak penenang tiap hari Sabtu.</li>
                <li>Atur buka-tutup katup zonasi RT 01 / RT 02 saat jam puncak pagi hari.</li>
                <li>Segera perbaiki rembesan pipa di titik SR-00016 agar tekanan hilir pulih.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Map Box & Side Detail Card */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex-1">
        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          className={`w-full ${
            isFullscreen ? "h-[calc(100vh-180px)]" : "h-[540px] sm:h-[620px]"
          } z-10`}
        />

        {/* Floating Quick Stats Pills (Kiri Atas Peta) */}
        <div className="absolute top-4 left-4 z-20 hidden sm:flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="pointer-events-auto px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white text-xs font-bold shadow-lg flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{filteredData.customers.length} Titik Sambungan Rumah Warga</span>
          </div>
          <div className="pointer-events-auto px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-cyan-300 text-xs font-bold shadow-lg flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>{filteredData.reservoirs.length} Bak &amp; Reservoir Desa</span>
          </div>
        </div>

        {/* Detail Drawer Card (Kanan Bawah Peta saat Titik Diklik) */}
        {activeItem && (
          <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white p-4 rounded-3xl shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Header Drawer */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">
                  {activeItem.type === "RESERVOIR"
                    ? activeItem.reservoir?.type === "INTAKE"
                      ? "🏔️"
                      : "🛢️"
                    : activeItem.customer?.activeComplaint
                    ? "🟡"
                    : activeItem.customer?.billingStatus === "UNPAID"
                    ? "🔴"
                    : "🟢"}
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {activeItem.type === "CUSTOMER"
                      ? activeItem.customer?.name
                      : activeItem.reservoir?.name}
                  </h4>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {activeItem.type === "CUSTOMER"
                      ? `${activeItem.customer?.connectionNo} • ${activeItem.customer?.dusun}`
                      : `${activeItem.reservoir?.typeLabel} • ${activeItem.reservoir?.elevationM} mdpl`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Drawer: Customer vs Reservoir */}
            {activeItem.type === "CUSTOMER" && activeItem.customer && (
              <div className="space-y-3 text-xs">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant={activeItem.customer.billingStatus === "PAID" ? "success" : "danger"}
                    size="sm"
                    className="font-bold text-[10px]"
                  >
                    {activeItem.customer.billingStatus === "PAID"
                      ? "🟢 Tagihan Lunas"
                      : "🔴 Belum Lunas (Tunggakan)"}
                  </Badge>

                  {activeItem.customer.activeComplaint && (
                    <Badge variant="warning" size="sm" className="font-bold text-[10px] animate-pulse">
                      🟡 Ada Pengaduan Gangguan
                    </Badge>
                  )}
                </div>

                {/* Complaint Alert if any */}
                {activeItem.customer.activeComplaint && (
                  <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-600/50 text-amber-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center space-x-1">
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        <span>{activeItem.customer.activeComplaint.category.replace(/_/g, " ")}</span>
                      </span>
                      <span className="font-mono text-[10px] text-amber-300">
                        {activeItem.customer.activeComplaint.ticketNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-100/90 leading-relaxed">
                      &quot;{activeItem.customer.activeComplaint.description}&quot;
                    </p>
                    <div className="pt-1 flex justify-between items-center text-[10px] text-amber-300/80">
                      <span>Status: {activeItem.customer.activeComplaint.status}</span>
                      <span>Prioritas: {activeItem.customer.activeComplaint.priority}</span>
                    </div>
                  </div>
                )}

                {/* Customer Metrics */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px]">No. Seri Meter:</span>
                    <p className="font-mono font-bold text-amber-300">
                      {activeItem.customer.meterSerial}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Stand Meter Terakhir:</span>
                    <p className="font-mono font-bold text-emerald-400">
                      {activeItem.customer.lastReading.toFixed(2)} m³
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">No. WhatsApp:</span>
                    <p className="font-mono text-slate-200">
                      {activeItem.customer.phone || "(Belum terdaftar)"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Tagihan Periode Ini:</span>
                    <p className="font-black text-slate-100">Rp 10.000,-</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-1">
                  {activeItem.customer.activeComplaint ? (
                    <button
                      type="button"
                      onClick={() => handleContactCustomerIssue(activeItem.customer!)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Kabari Warga via WA</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendCustomerWa(activeItem.customer!)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Kirim WA Tagihan</span>
                    </button>
                  )}

                  <a
                    href={`https://www.google.com/maps?q=${activeItem.customer.latitude},${activeItem.customer.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="Buka rute navigasi di Google Maps"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {activeItem.type === "RESERVOIR" && activeItem.reservoir && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-sky-950/70 border border-sky-800/60 text-sky-200 space-y-1.5">
                  <div className="font-bold text-sky-300 text-xs">
                    🔵 {activeItem.reservoir.typeLabel}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {activeItem.reservoir.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px]">Ketinggian Elevasi:</span>
                    <p className="font-bold text-cyan-300">
                      {activeItem.reservoir.elevationM} mdpl
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Volume Kapasitas:</span>
                    <p className="font-bold text-white">
                      {activeItem.reservoir.capacityLiters.toLocaleString("id-ID")} Liter
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Sistem Aliran:</span>
                    <p className="text-emerald-400 font-semibold text-[10px]">
                      {activeItem.reservoir.flowSystem}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Dusun Dilayani:</span>
                    <p className="text-slate-200 font-medium text-[10px]">
                      {activeItem.reservoir.dusunServed}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <a
                    href={`https://www.google.com/maps?q=${activeItem.reservoir.latitude},${activeItem.reservoir.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Lihat Koordinat di Google Maps</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Footer Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Sambungan Warga
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {customers.length} SR
            </div>
          </div>
          <span className="text-2xl">🏡</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              🟢 Status Lunas
            </span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">
              {spatialMetrics.paidCount} SR
            </div>
          </div>
          <span className="text-2xl">💧</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              🔴 Belum Lunas / Tunggakan
            </span>
            <div className="text-xl font-black text-rose-600 mt-0.5">
              {spatialMetrics.unpaidCount} SR
            </div>
          </div>
          <span className="text-2xl">⏳</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              🟡 Pengaduan Gangguan Aktif
            </span>
            <div className="text-xl font-black text-amber-600 mt-0.5">
              {spatialMetrics.complaintCount} Titik
            </div>
          </div>
          <span className="text-2xl">⚠️</span>
        </div>
      </div>
    </div>
  );
}
