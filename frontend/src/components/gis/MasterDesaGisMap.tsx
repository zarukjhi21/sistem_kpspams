"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Layers,
  Satellite,
  Compass,
  Droplets,
  Search,
  X,
  Sparkles,
  ExternalLink,
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
  Gauge,
  Check,
  RotateCcw,
  Zap,
} from "lucide-react";
import L from "leaflet";
import { Badge } from "@/components/ui/Badge";
import { MasterGisCustomer } from "@/types/gis";

interface MasterDesaGisMapProps {
  customers: MasterGisCustomer[];
  reservoirs?: any[]; // Kept optional for backward compatibility
  selectedCustomerId?: number | null;
  onSelectCustomer?: (customer: MasterGisCustomer) => void;
  onSelectReservoir?: (reservoir: any) => void;
}

export function MasterDesaGisMap({
  customers,
  selectedCustomerId,
  onSelectCustomer,
}: MasterDesaGisMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // States
  const [mapType, setMapType] = useState<"google-hybrid" | "google-streets" | "esri-topo">(
    "google-hybrid"
  );
  const [filterLayer, setFilterLayer] = useState<
    "ALL" | "PAID" | "UNPAID" | "STUCK" | "COMPLAINT"
  >("ALL");
  const [filterDusun, setFilterDusun] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<MasterGisCustomer | null>(null);
  const [showMeterAnalysis, setShowMeterAnalysis] = useState(false);

  // Dusun list from customers
  const dusunList = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.dusun) set.add(c.dusun);
    });
    return Array.from(set);
  }, [customers]);

  // Evaluasi Spasial Kondisi Meteran & Tagihan Real-time
  const spatialMetrics = useMemo(() => {
    const totalCustomers = customers.length;
    const meterDamagedCount = customers.filter(
      (c) => c.meterCondition === "STUCK" || c.meterCondition === "DAMAGED" || c.isMeterDamaged
    ).length;
    const meterGoodCount = Math.max(0, totalCustomers - meterDamagedCount);

    const paidCount = customers.filter(
      (c) => c.billingStatus === "PAID"
    ).length;
    const unpaidCount = customers.filter(
      (c) => c.billingStatus === "UNPAID"
    ).length;
    const complaintCount = customers.filter((c) => !!c.activeComplaint).length;

    // Keluhan per dusun
    const complaintsByDusun: Record<string, number> = {};
    customers.forEach((c) => {
      if (c.activeComplaint) {
        complaintsByDusun[c.dusun] = (complaintsByDusun[c.dusun] || 0) + 1;
      }
    });

    return {
      totalCustomers,
      meterDamagedCount,
      meterGoodCount,
      paidCount,
      unpaidCount,
      complaintCount,
      complaintsByDusun,
    };
  }, [customers]);

  // Filter Data yang ditampilkan di Peta
  const filteredCustomers = useMemo(() => {
    let custs = customers.filter((c) => {
      if (filterDusun !== "ALL" && c.dusun !== filterDusun) return false;

      const isDamaged =
        c.meterCondition === "STUCK" || c.meterCondition === "DAMAGED" || c.isMeterDamaged;

      if (filterLayer === "STUCK") {
        return isDamaged;
      }
      if (filterLayer === "PAID") {
        return c.billingStatus === "PAID";
      }
      if (filterLayer === "UNPAID") {
        return c.billingStatus === "UNPAID";
      }
      if (filterLayer === "COMPLAINT") {
        return !!c.activeComplaint;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      custs = custs.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.connectionNo.toLowerCase().includes(q) ||
          c.dusun.toLowerCase().includes(q) ||
          (c.meterSerial && c.meterSerial.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.activeComplaint?.ticketNumber &&
            c.activeComplaint.ticketNumber.toLowerCase().includes(q))
      );
    }

    return custs;
  }, [customers, filterLayer, filterDusun, searchQuery]);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Titik Pusat Pemukiman Warga Dusun Lemo Baru Desa Kuajang
    const initialCenterLat = -3.4328;
    const initialCenterLng = 119.3755;

    const map = L.map(mapContainerRef.current, {
      center: [initialCenterLat, initialCenterLng],
      zoom: 16,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    // Zoom control kanan atas
    L.control.zoom({ position: "topright" }).addTo(map);

    // Google Hybrid Tile (Satelit Tajam + Nama Jalan & Rumah Warga)
    const tileLayer = L.tileLayer("https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["0", "1", "2", "3"],
      attribution: "&copy; Google Maps Satelit • Desa Kuajang",
      updateWhenIdle: false,
      keepBuffer: 6,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Markers Layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    // Invalidate size fix
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Marker Pins di Peta dengan Indikator Kondisi Meteran & Tagihan
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const mLayer = markersLayerRef.current;
    mLayer.clearLayers();

    filteredCustomers.forEach((cust) => {
      const isSelected = activeCustomer?.id === cust.id;
      const isMeterDamaged =
        cust.meterCondition === "STUCK" || cust.meterCondition === "DAMAGED" || cust.isMeterDamaged;

      // Logika Penentuan Tipe dan Warna Pin
      let pinColor = "#10b981"; // 🟢 Default: Hijau (Lunas & Normal)
      let pinType: "METER_DAMAGED" | "COMPLAINT" | "UNPAID" | "PAID" = "PAID";
      let pinSymbol = "✓";
      let pulseRing = "";

      if (isMeterDamaged) {
        // 🟠 Pin Oranye/Amber: Meteran Rusak / Jarum Macet (Air Mengalir)
        pinColor = "#ea580c";
        pinType = "METER_DAMAGED";
        pinSymbol = "⚙️";
        pulseRing = `
          <div style="
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            background: rgba(234, 88, 12, 0.45);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        `;
      } else if (cust.activeComplaint) {
        // 🟡 Pin Kuning: Pengaduan Gangguan
        pinColor = "#f59e0b";
        pinType = "COMPLAINT";
        pinSymbol = cust.activeComplaint.category === "PIPA_BOCOR" ? "🔧" : "⚠️";
        pulseRing = `
          <div style="
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            background: rgba(245, 158, 11, 0.45);
            animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        `;
      } else if (cust.billingStatus === "UNPAID") {
        // 🔴 Pin Merah: Belum Lunas
        pinColor = "#ef4444";
        pinType = "UNPAID";
        pinSymbol = "Rp";
      }

      const customerIcon = L.divIcon({
        className: `gis-pin-${pinType.toLowerCase()}`,
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            ${pulseRing}
            ${
              isSelected
                ? `<div style="position: absolute; inset: -5px; border-radius: 50%; border: 3px solid #fef08a; animation: ping 1.2s infinite;"></div>`
                : ""
            }
            <div style="
              width: 32px;
              height: 32px;
              background: ${pinColor};
              border: 2.5px solid ${isSelected ? "#fef08a" : "#ffffff"};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(0,0,0,0.55);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <div style="
                transform: rotate(45deg);
                color: #ffffff;
                font-size: ${pinType === "METER_DAMAGED" ? "13px" : pinType === "COMPLAINT" ? "12px" : "11px"};
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
        iconSize: [34, 34],
        iconAnchor: [17, 32],
      });

      const zIndex =
        pinType === "METER_DAMAGED"
          ? 400
          : pinType === "COMPLAINT"
          ? 300
          : pinType === "UNPAID"
          ? 200
          : 100;

      const marker = L.marker([cust.latitude, cust.longitude], {
        icon: customerIcon,
        zIndexOffset: zIndex,
      });

      const statusBadgeText = isMeterDamaged
        ? "⚠️ Jarum Meteran Macet (Air Mengalir)"
        : pinType === "COMPLAINT"
        ? `🟡 Gangguan: ${cust.activeComplaint?.category.replace(/_/g, " ")}`
        : pinType === "UNPAID"
        ? "🔴 Menunggak (Belum Bayar)"
        : "🟢 Lunas & Meter Normal";

      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <strong style="color: #f8fafc; font-size: 12px;">${cust.name}</strong><br/>
          <span style="font-family: monospace; color: #94a3b8;">${cust.connectionNo} • ${cust.dusun}</span><br/>
          <span style="font-weight: 700; color: ${
            isMeterDamaged
              ? "#fb923c"
              : pinType === "COMPLAINT"
              ? "#fcd34d"
              : pinType === "UNPAID"
              ? "#fca5a5"
              : "#6ee7b7"
          };">
            ${statusBadgeText}
          </span>
        </div>
      `,
        { direction: "top", className: "gis-custom-tooltip" }
      );

      marker.on("click", () => {
        setActiveCustomer(cust);
        onSelectCustomer?.(cust);
        mapInstanceRef.current?.setView([cust.latitude, cust.longitude], 18, { animate: true });
      });

      mLayer.addLayer(marker);
    });
  }, [filteredCustomers, activeCustomer, onSelectCustomer]);

  // Center ke pelanggan yang dipilih dari luar
  useEffect(() => {
    if (selectedCustomerId && customers.length > 0) {
      const match = customers.find((c) => c.id === selectedCustomerId);
      if (match && mapInstanceRef.current) {
        setActiveCustomer(match);
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
        `sebesar Rp 10.000,- telah terbit. Silakan lakukan pembayaran ke petugas lapangan kami atau via kas KPSPAMS.`
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
      `Yth. Bpk/Ibu ${cust.name}, menindaklanjuti status sambungan air Anda (${cust.connectionNo}), tim teknisi KPSPAMS siap melakukan pengecekan ke lokasi rumah Anda.`
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
          {/* Legend & Filter Cepat Berdasarkan Kondisi Riil */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-brand-gold-400" />
              <span>Status SR Riil:</span>
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

            {/* 🟠 Pin Oranye: Meteran Rusak / Jarum Macet */}
            <button
              type="button"
              onClick={() => setFilterLayer(filterLayer === "STUCK" ? "ALL" : "STUCK")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterLayer === "STUCK"
                  ? "bg-orange-600 border-orange-400 text-white shadow-md shadow-orange-900/40"
                  : "bg-slate-800/90 border-slate-700/80 text-orange-300 hover:bg-slate-800"
              }`}
              title="Filter rumah warga yang jarum meterannya macet tetapi air tetap mengalir"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <span>⚠️ Meteran Rusak / Jarum Macet ({spatialMetrics.meterDamagedCount})</span>
            </button>

            {/* 🟡 Pin Kuning: Pengaduan Gangguan Air */}
            {spatialMetrics.complaintCount > 0 && (
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
            )}
          </div>

          {/* Action Buttons: Pantau Kondisi Fisik Meteran, Base Map, Fullscreen */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Panel Pemantauan Fisik Meteran */}
            <button
              type="button"
              onClick={() => setShowMeterAnalysis(!showMeterAnalysis)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                showMeterAnalysis
                  ? "bg-brand-maroon-700 text-brand-gold-300 border-brand-gold-400 shadow-md"
                  : "bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700"
              }`}
              title="Buka panel pemantauan kondisi meteran air warga (normal vs macet)"
            >
              <Gauge className="w-3.5 h-3.5 text-brand-gold-400" />
              <span>Pantau Kondisi Meteran</span>
              {spatialMetrics.meterDamagedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black">
                  {spatialMetrics.meterDamagedCount}
                </span>
              )}
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
              placeholder="Cari nama warga, nomor SR, atau nomor meter..."
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

      {/* Panel Pemantauan Fisik Meteran Air Desa Kuajang */}
      {showMeterAnalysis && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-maroon-950 to-slate-900 text-white border border-brand-gold-500/40 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-brand-gold-400/20 text-brand-gold-300 text-[11px] font-bold border border-brand-gold-400/30">
                <Sparkles className="w-3 h-3 text-brand-gold-400" />
                <span>Panel Pemantauan Fisik Meteran Air Desa Kuajang</span>
              </div>
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-orange-400" />
                <span>Monitoring Kelancaran Jarum Meter &amp; Deteksi Kerusakan Fisik</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowMeterAnalysis(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Card 1: Distribusi Kondisi Meteran */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="font-extrabold text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Status Kelancaran Meteran</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Dari total <strong>{spatialMetrics.totalCustomers} Sambungan Rumah</strong>:
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-[11px] text-emerald-200">
                  <span>✓ Berfungsi Normal (Jarum Berputar):</span>
                  <strong className="font-mono">{spatialMetrics.meterGoodCount} Unit</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-orange-950/60 border border-orange-800/50 text-[11px] text-orange-200">
                  <span>⚠️ Jarum Macet (Air Mengalir):</span>
                  <strong className="font-mono">{spatialMetrics.meterDamagedCount} Unit</strong>
                </div>
              </div>
            </div>

            {/* Card 2: Prosedur Penandaan Petugas di Lapangan */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="font-extrabold text-amber-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Panduan Petugas Lapangan</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Saat berkeliling menagih, jika petugas mendapati <strong>air mengalir ke kran warga tetapi jarum meteran tidak bergerak</strong>:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-[10px] text-slate-300 space-y-1">
                <div className="flex items-start space-x-1.5">
                  <span className="text-orange-400 font-bold">1.</span>
                  <span>Di menu <strong>Catat &amp; Tagih Lapangan</strong>, aktifkan centang <em>&quot;Tandai: Jarum Meteran Macet&quot;</em>.</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-orange-400 font-bold">2.</span>
                  <span>Sistem secara otomatis akan memberi pin oranye ⚙️ pada peta GIS ini.</span>
                </div>
              </div>
            </div>

            {/* Card 3: Rekomendasi Tindak Lanjut Pengurus KPSPAMS */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="font-extrabold text-cyan-300 flex items-center space-x-1.5">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>Rekomendasi Tindak Lanjut</span>
              </div>
              <ul className="text-slate-300 text-[11px] space-y-1.5 list-disc list-inside">
                <li>Jarum meteran yang macet menyebabkan pemakaian warga tidak terukur secara akurat.</li>
                <li>Pengurus dapat merekap data SR ber-pin oranye untuk jadwal pergantian unit meteran Onda/SNI baru.</li>
                <li>Tetap terapkan iuran beban dasar bulanan Rp 10.000,- hingga unit meteran selesai diganti.</li>
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
            isFullscreen ? "h-[calc(100vh-180px)]" : "h-[490px] sm:h-[620px]"
          } z-10`}
        />

        {/* Floating Quick Stats Pills (Kiri Atas Peta) */}
        <div className="absolute top-4 left-4 z-20 hidden sm:flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="pointer-events-auto px-3.5 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white text-xs font-bold shadow-lg flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{filteredCustomers.length} Titik Sambungan Rumah Warga</span>
          </div>

          {spatialMetrics.meterDamagedCount > 0 && (
            <div className="pointer-events-auto px-3.5 py-1.5 rounded-2xl bg-orange-950/90 backdrop-blur-md border border-orange-700/80 text-orange-200 text-xs font-bold shadow-lg flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <span>{spatialMetrics.meterDamagedCount} Meteran Jarum Macet</span>
            </div>
          )}
        </div>

        {/* Detail Drawer Card (Kanan Bawah Peta saat Titik Sambungan Diklik) */}
        {activeCustomer && (
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 left-3 sm:left-auto sm:w-96 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl space-y-3 max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Header Drawer */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">
                  {activeCustomer.meterCondition === "STUCK" ||
                  activeCustomer.meterCondition === "DAMAGED" ||
                  activeCustomer.isMeterDamaged
                    ? "⚙️"
                    : activeCustomer.activeComplaint
                    ? "🟡"
                    : activeCustomer.billingStatus === "UNPAID"
                    ? "🔴"
                    : "🟢"}
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">{activeCustomer.name}</h4>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {activeCustomer.connectionNo} • Dusun {activeCustomer.dusun}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Drawer */}
            <div className="space-y-3 text-xs">
              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant={activeCustomer.billingStatus === "PAID" ? "success" : "danger"}
                  size="sm"
                  className="font-bold text-[10px]"
                >
                  {activeCustomer.billingStatus === "PAID"
                    ? "🟢 Tagihan Lunas"
                    : "🔴 Belum Lunas (Tunggakan)"}
                </Badge>

                {activeCustomer.meterCondition === "STUCK" ||
                activeCustomer.meterCondition === "DAMAGED" ||
                activeCustomer.isMeterDamaged ? (
                  <Badge variant="warning" size="sm" className="font-bold text-[10px] bg-orange-600/90 text-white border-orange-400 animate-pulse">
                    ⚠️ Jarum Meteran Macet
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm" className="font-bold text-[10px] bg-emerald-950 text-emerald-300 border-emerald-700/60">
                    ✓ Jarum Berputar Normal
                  </Badge>
                )}

                {activeCustomer.activeComplaint && (
                  <Badge variant="warning" size="sm" className="font-bold text-[10px] animate-pulse">
                    🟡 Ada Pengaduan Gangguan
                  </Badge>
                )}
              </div>

              {/* Alert Khusus jika Jarum Meteran Macet */}
              {(activeCustomer.meterCondition === "STUCK" ||
                activeCustomer.meterCondition === "DAMAGED" ||
                activeCustomer.isMeterDamaged) && (
                <div className="p-3 rounded-2xl bg-orange-950/80 border border-orange-500/60 text-orange-200 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-[11px] text-orange-300">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span>Perhatian: Jarum Meter Air Macet!</span>
                  </div>
                  <p className="text-[11px] text-orange-100/90 leading-relaxed">
                    Air bersih tetap mengalir lancar ke rumah warga, namun jarum meteran tidak bergerak.
                    Disarankan untuk segera menjadwalkan penggantian unit meteran baru.
                  </p>
                </div>
              )}

              {/* Complaint Alert if any */}
              {activeCustomer.activeComplaint && (
                <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-600/50 text-amber-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center space-x-1">
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      <span>{activeCustomer.activeComplaint.category.replace(/_/g, " ")}</span>
                    </span>
                    <span className="font-mono text-[10px] text-amber-300">
                      {activeCustomer.activeComplaint.ticketNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100/90 leading-relaxed">
                    &quot;{activeCustomer.activeComplaint.description}&quot;
                  </p>
                </div>
              )}

              {/* Customer Metrics */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px]">No. Seri Meter:</span>
                  <p className="font-mono font-bold text-amber-300">
                    {activeCustomer.meterSerial}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Stand Meter Terakhir:</span>
                  <p className="font-mono font-bold text-emerald-400">
                    {activeCustomer.lastReading.toFixed(2)} m³
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">No. WhatsApp:</span>
                  <p className="font-mono text-slate-200">
                    {activeCustomer.phone || "(Belum terdaftar)"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Tagihan Periode Ini:</span>
                  <p className="font-black text-slate-100">Rp 10.000,-</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-1">
                {activeCustomer.activeComplaint ? (
                  <button
                    type="button"
                    onClick={() => handleContactCustomerIssue(activeCustomer)}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kabari Warga via WA</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendCustomerWa(activeCustomer)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kirim WA Tagihan</span>
                  </button>
                )}

                <a
                  href={`https://www.google.com/maps?q=${activeCustomer.latitude},${activeCustomer.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  title="Buka rute navigasi di Google Maps"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer Bar 4 Kotak */}
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
              🟠 Jarum Meter Macet
            </span>
            <div className="text-xl font-black text-orange-600 mt-0.5">
              {spatialMetrics.meterDamagedCount} SR
            </div>
          </div>
          <span className="text-2xl">⚙️</span>
        </div>
      </div>
    </div>
  );
}
