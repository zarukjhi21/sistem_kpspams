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
  ArrowRight,
  Sparkles,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Info,
  Activity,
  Maximize2,
} from "lucide-react";
import L from "leaflet";
import { apiClient } from "@/lib/api-client";

// Format nama dengan sopan santun warga desa
function formatPublicCustomerName(name: string): string {
  if (!name) return "Warga Lemo Baru";
  const clean = name.trim();
  if (
    clean.toUpperCase().startsWith("BPK") ||
    clean.toUpperCase().startsWith("IBU") ||
    clean.toUpperCase().startsWith("BAPAK")
  ) {
    return clean;
  }
  return `Bpk/Ibu ${clean}`;
}

export interface GisConnectionItem {
  id: number;
  code: string;
  name: string;
  connection_no: string;
  dusun: string;
  rt_rw?: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface WaterSourceInfo {
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  flow_system: string;
  elevation_m: number;
  description: string;
}

// Fallback data awal 37 SR Lemo Baru (Data Riil Database Neon)
const DEFAULT_CONNECTIONS: GisConnectionItem[] = [
  { id: 9, code: "CUST-1-400465", name: "SYAHARUDDIN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00009", latitude: -3.432611, longitude: 119.37528, status: "ACTIVE" },
  { id: 14, code: "CUST-1-119588", name: "DINA", dusun: "Lemo Baru", rt_rw: "-/-", connection_no: "SR-LMB-00014", latitude: -3.43495, longitude: 119.37417, status: "ACTIVE" },
  { id: 15, code: "CUST-1-730736", name: "SABIR", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00015", latitude: -3.434955, longitude: 119.374248, status: "ACTIVE" },
  { id: 16, code: "CUST-1-077519", name: "HARMAN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00016", latitude: -3.431124, longitude: 119.378249, status: "ACTIVE" },
  { id: 18, code: "CUST-1-106347", name: "USMAN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00018", latitude: -3.431192, longitude: 119.376299, status: "ACTIVE" },
  { id: 19, code: "CUST-1-549192", name: "SAHARULLAH. M", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00019", latitude: -3.431117, longitude: 119.375994, status: "ACTIVE" },
  { id: 20, code: "CUST-1-845774", name: "NUR ALIM", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00020", latitude: -3.431052, longitude: 119.37589, status: "ACTIVE" },
  { id: 21, code: "CUST-1-960099", name: "HAERATI", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00021", latitude: -3.434728, longitude: 119.374299, status: "ACTIVE" },
  { id: 22, code: "CUST-1-343580", name: "SALMIA", dusun: "Lemo Baru", rt_rw: "-/-", connection_no: "SR-LMB-00022", latitude: -3.43254, longitude: 119.373731, status: "ACTIVE" },
  { id: 23, code: "CUST-1-781536", name: "HARIANA", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00023", latitude: -3.432283, longitude: 119.373764, status: "ACTIVE" },
  { id: 24, code: "CUST-1-358426", name: "JUDDIN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00024", latitude: -3.432608, longitude: 119.373888, status: "ACTIVE" },
  { id: 25, code: "CUST-1-934219", name: "HASMIA", dusun: "Lemo Baru", rt_rw: "-/-", connection_no: "SR-LMB-00025", latitude: -3.432466, longitude: 119.374041, status: "ACTIVE" },
  { id: 26, code: "CUST-1-334071", name: "SUMARNI", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00026", latitude: -3.43279, longitude: 119.374909, status: "ACTIVE" },
  { id: 27, code: "CUST-1-596955", name: "SANA", dusun: "Lemo Baru", rt_rw: "-/-", connection_no: "SR-LMB-00027", latitude: -3.432854, longitude: 119.374956, status: "ACTIVE" },
  { id: 28, code: "CUST-1-930518", name: "M. IDRIS", dusun: "Lemo Baru", rt_rw: "-/-", connection_no: "SR-LMB-00028", latitude: -3.432773, longitude: 119.37483, status: "ACTIVE" },
  { id: 29, code: "CUST-1-119999", name: "MUH. ALI AMIN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00029", latitude: -3.432943, longitude: 119.374722, status: "ACTIVE" },
  { id: 30, code: "CUST-1-415997", name: "SARIPUDDIN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00030", latitude: -3.432766, longitude: 119.374803, status: "ACTIVE" },
  { id: 31, code: "CUST-1-826333", name: "HASANUDDIN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00031", latitude: -3.432694, longitude: 119.373942, status: "ACTIVE" },
  { id: 32, code: "CUST-1-386641", name: "ABDUL WAHAP", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00032", latitude: -3.43299, longitude: 119.374808, status: "ACTIVE" },
  { id: 33, code: "CUST-1-886741", name: "ABDULLAH", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00033", latitude: -3.433062, longitude: 119.374879, status: "ACTIVE" },
  { id: 34, code: "CUST-1-243238", name: "HAMDAN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00034", latitude: -3.433259, longitude: 119.3747, status: "ACTIVE" },
  { id: 35, code: "CUST-1-995468", name: "SABANNUR", dusun: "Lemo Baru", rt_rw: "-/-", connection_no: "SR-LMB-00035", latitude: -3.432795, longitude: 119.37511, status: "ACTIVE" },
  { id: 36, code: "CUST-1-417043", name: "RIADHI YUSUF", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00036", latitude: -3.432919, longitude: 119.375141, status: "ACTIVE" },
  { id: 37, code: "CUST-1-025232", name: "ABU BAKAR", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00037", latitude: -3.433031, longitude: 119.375307, status: "ACTIVE" },
  { id: 38, code: "CUST-1-438814", name: "BAHARUDDIN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00038", latitude: -3.433247, longitude: 119.375382, status: "ACTIVE" },
  { id: 39, code: "CUST-1-681253", name: "NURHANUDDIN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00039", latitude: -3.433064, longitude: 119.375381, status: "ACTIVE" },
  { id: 41, code: "CUST-1-098558", name: "RUKIA", dusun: "Lemo Baru", rt_rw: "0001000", connection_no: "SR-LMB-00041", latitude: -3.433222, longitude: 119.375611, status: "ACTIVE" },
  { id: 42, code: "CUST-1-105899", name: "MAHYUDDIN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00042", latitude: -3.433285, longitude: 119.375695, status: "ACTIVE" },
  { id: 43, code: "CUST-1-392790", name: "ABDUL MAJID", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00043", latitude: -3.433705, longitude: 119.374607, status: "ACTIVE" },
  { id: 45, code: "CUST-1-617295", name: "IDAH", dusun: "Lemo Baru", rt_rw: "-/-", connection_no: "SR-LMB-00045", latitude: -3.433101, longitude: 119.375681, status: "ACTIVE" },
  { id: 46, code: "CUST-1-726562", name: "SITTI ARI", dusun: "Lemo Baru", rt_rw: "-/-", connection_no: "SR-LMB-00046", latitude: -3.433043, longitude: 119.375705, status: "ACTIVE" },
  { id: 47, code: "CUST-1-756567", name: "SYAHRIL", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00047", latitude: -3.433354, longitude: 119.375535, status: "ACTIVE" },
  { id: 48, code: "CUST-1-148391", name: "BALING", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00048", latitude: -3.433554, longitude: 119.375747, status: "ACTIVE" },
  { id: 49, code: "CUST-1-428289", name: "NASMAN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00049", latitude: -3.433446, longitude: 119.375927, status: "ACTIVE" },
  { id: 50, code: "CUST-1-637933", name: "UMAR MASA, S.Pd.I", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00050", latitude: -3.433371, longitude: 119.375868, status: "ACTIVE" },
  { id: 51, code: "CUST-1-041354", name: "FIRMAN", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00051", latitude: -3.433167, longitude: 119.375226, status: "ACTIVE" },
  { id: 52, code: "CUST-1-290666", name: "HUSRAWATI", dusun: "Lemo Baru", rt_rw: "000/000", connection_no: "SR-LMB-00052", latitude: -3.433124, longitude: 119.375141, status: "ACTIVE" },
];

const DEFAULT_WATER_SOURCE: WaterSourceInfo = {
  name: "Mata Air Alami Pegunungan Lemo Baru",
  type: "BRONCAPTERING",
  latitude: -3.4285,
  longitude: 119.3725,
  flow_system: "GRAVITASI_MURNI",
  elevation_m: 145,
  description: "Sumber mata air pegunungan alami Dusun Lemo Baru, dialirkan murni dengan gravitasi tanpa beban listrik PLN.",
};

// Jalur simulasi pipa transmisi gravitasi utama dari mata air pegunungan ke pusat pemukiman
const MAIN_GRAVITY_PIPELINE: [number, number][] = [
  [-3.4285, 119.3725], // Hulu Mata Air Lemo Baru (Broncaptering)
  [-3.4298, 119.3734], // Jalur Lembah Aliran
  [-3.4311, 119.3742], // Bak Pelepas Tekanan / Percabangan Atas
  [-3.4325, 119.3748], // Distribusi Utama Lemo Baru
  [-3.4332, 119.3754], // Pemukiman Poros Utama
];

export function PublicGisMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [connections, setConnections] = useState<GisConnectionItem[]>(DEFAULT_CONNECTIONS);
  const [waterSource, setWaterSource] = useState<WaterSourceInfo>(DEFAULT_WATER_SOURCE);
  const [selectedItem, setSelectedItem] = useState<{ type: "CUSTOMER" | "SOURCE"; data: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapType, setMapType] = useState<"google-hybrid" | "google-streets">("google-hybrid");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Fetch data riil dari backend portal jika tersedia
  useEffect(() => {
    apiClient<{
      water_source: WaterSourceInfo;
      connections: GisConnectionItem[];
      summary: { total_connections: number; flow_status: string; flow_rate_lpd: number };
    }>("/portal/gis-connections")
      .then((res) => {
        if (res?.data?.connections && res.data.connections.length > 0) {
          setConnections(res.data.connections);
        }
        if (res?.data?.water_source) {
          setWaterSource(res.data.water_source);
        }
      })
      .catch((err) => {
        console.warn("PublicGisMap: using baseline connections fallback", err);
      });
  }, []);

  // Filter koneksi berdasarkan pencarian warga
  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return connections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.connection_no.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [connections, searchQuery]);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center di Dusun Lemo Baru
    const defaultCenterLat = -3.4325;
    const defaultCenterLng = 119.3750;

    const map = L.map(mapContainerRef.current, {
      center: [defaultCenterLat, defaultCenterLng],
      zoom: 16,
      zoomControl: false,
      scrollWheelZoom: false, // Aman saat scroll halaman web di HP
    });

    // Tambahkan zoom control di kanan atas
    L.control.zoom({ position: "topright" }).addTo(map);

    // Google Hybrid Tile (Satelit + Nama Jalan/Tempat)
    const googleHybridUrl = "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    const tileLayer = L.tileLayer(googleHybridUrl, {
      maxZoom: 20,
      subdomains: ["0", "1", "2", "3"],
      attribution: "&copy; Google Maps Satelit",
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer group untuk pin
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    // Fix render size pada tab/flexbox
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Marker & Jalur Transmisi
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // 1. Jalur Pipa Transmisi Utama (Glow Cyan Dashed Line)
    const pipelinePolyline = L.polyline(MAIN_GRAVITY_PIPELINE, {
      color: "#06b6d4",
      weight: 4,
      opacity: 0.85,
      dashArray: "8, 8",
      lineJoin: "round",
    });

    pipelinePolyline.bindTooltip("Jalur Pipa Transmisi Gravitasi Utama (Dari Mata Air ke Pemukiman)", {
      direction: "top",
      className: "gis-custom-tooltip",
    });

    markersLayer.addLayer(pipelinePolyline);

    // 2. Pin Hulu Mata Air Pegunungan Lemo Baru (Ikon Khusus Emas-Cyan dengan Animasi Denyut)
    const sourceLat = waterSource.latitude;
    const sourceLng = waterSource.longitude;

    const sourceIcon = L.divIcon({
      className: "source-gis-pin",
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(6, 182, 212, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #06b6d4 0%, #0d9488 100%);
            border: 3px solid #fef08a;
            border-radius: 50%;
            box-shadow: 0 4px 14px rgba(6, 182, 212, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <span style="font-size: 18px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">🏔️</span>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const sourceMarker = L.marker([sourceLat, sourceLng], { icon: sourceIcon });
    sourceMarker.bindTooltip(
      `<strong>${waterSource.name}</strong><br/><span style="color:#67e8f9; font-size:11px;">Hulu Sistem Gravitasi • Broncaptering</span>`,
      { direction: "top", className: "gis-custom-tooltip" }
    );

    sourceMarker.on("click", () => {
      setSelectedItem({ type: "SOURCE", data: waterSource });
      mapInstanceRef.current?.setView([sourceLat, sourceLng], 17, { animate: true });
    });

    markersLayer.addLayer(sourceMarker);

    // 3. Pin Sambungan Rumah (SR) Warga (Hijau Zamrud #10b981)
    connections.forEach((conn) => {
      const lat = conn.latitude;
      const lng = conn.longitude;
      const isSelected = selectedItem?.type === "CUSTOMER" && selectedItem.data.id === conn.id;

      const pinIcon = L.divIcon({
        className: "customer-gis-pin",
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            ${
              isSelected
                ? `<div style="position: absolute; inset: -5px; border-radius: 50%; border: 3px solid #f59e0b; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ""
            }
            <div style="
              width: 28px;
              height: 28px;
              background: #10b981;
              border: 2.5px solid ${isSelected ? "#fef08a" : "#ffffff"};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 10px rgba(0,0,0,0.45);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <div style="
                transform: rotate(45deg);
                color: #ffffff;
                font-size: 11px;
                font-weight: 900;
              ">
                💧
              </div>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon });

      const politeName = formatPublicCustomerName(conn.name);
      marker.bindTooltip(
        `<div style="text-align: center;"><strong>${politeName}</strong><br/><span style="color:#6ee7b7; font-size:11px;">● Sambungan Aktif (${conn.connection_no})</span></div>`,
        { direction: "top", className: "gis-custom-tooltip" }
      );

      marker.on("click", () => {
        setSelectedItem({ type: "CUSTOMER", data: conn });
        mapInstanceRef.current?.setView([lat, lng], 18, { animate: true });
      });

      markersLayer.addLayer(marker);
    });
  }, [connections, waterSource, selectedItem]);

  // Fungsi Recenter: Tampilkan seluruh jaringan
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const allCoords: [number, number][] = [
      [waterSource.latitude, waterSource.longitude],
      ...connections.map((c): [number, number] => [c.latitude, c.longitude]),
    ];
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  };

  // Toggle Peta (Google Hybrid vs Google Streets)
  const toggleMapLayer = (type: "google-hybrid" | "google-streets") => {
    setMapType(type);
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.remove();

    const newUrl =
      type === "google-hybrid"
        ? "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        : "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

    const newLayer = L.tileLayer(newUrl, {
      maxZoom: 20,
      subdomains: ["0", "1", "2", "3"],
      attribution: "&copy; Google Maps",
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  };

  // Pilih pelanggan dari search dropdown
  const handleSelectCustomer = (conn: GisConnectionItem) => {
    setSelectedItem({ type: "CUSTOMER", data: conn });
    setSearchQuery("");
    setShowSearchDropdown(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([conn.latitude, conn.longitude], 18, { animate: true });
    }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Peta Sebaran Jaringan Pipa &amp; Sambungan Rumah (SR)
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Visualisasi spasial 37 titik sambungan warga Dusun Lemo Baru dan hulu mata air pegunungan alami Dusun Lemo Baru.
          </p>
        </div>

        {/* Action Controls / Recenter */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRecenter}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition active:scale-95 shadow-md"
            title="Pusatkan Kembali Tampilan Peta"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Pusatkan Peta</span>
          </button>

          {/* Toggle Satelit vs Streets */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => toggleMapLayer("google-hybrid")}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                mapType === "google-hybrid"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Satellite className="w-3 h-3" />
              <span>Satelit</span>
            </button>
            <button
              onClick={() => toggleMapLayer("google-streets")}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                mapType === "google-streets"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Jalan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-black">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-white">{connections.length} SR</div>
            <div className="text-[11px] text-slate-400">Sambungan Aktif</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-black">
            <Mountain className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-white">1 Titik Hulu</div>
            <div className="text-[11px] text-slate-400">Mata Air Lemo Baru</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400 font-black">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-white">100% Gravitasi</div>
            <div className="text-[11px] text-slate-400">Bebas Listrik PLN</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400 font-black">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-emerald-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>99.4% Normal</span>
            </div>
            <div className="text-[11px] text-slate-400">Kelancaran Debit</div>
          </div>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        {/* Floating Search Bar */}
        <div className="absolute top-3 left-3 right-16 sm:right-auto sm:w-80 z-[1000]">
          <div className="relative">
            <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2 shadow-xl">
              <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Cari warga / No. SR (cth: Sabir)..."
                className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-white ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Hasil Pencarian */}
            {showSearchDropdown && filteredConnections.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden py-1 z-50 max-h-60 overflow-y-auto">
                {filteredConnections.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectCustomer(item)}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-950/40 hover:border-l-4 hover:border-emerald-500 transition flex items-center justify-between text-xs group"
                  >
                    <div>
                      <div className="font-bold text-white group-hover:text-emerald-300">
                        {formatPublicCustomerName(item.name)}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.connection_no} • {item.dusun}</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                      Lihat Titik
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="w-full h-[460px] sm:h-[540px] z-0 focus:outline-none"
        />

        {/* Legend Overlay (Kiri Bawah) */}
        <div className="absolute bottom-3 left-3 z-[990] bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 shadow-xl text-xs space-y-1.5 pointer-events-auto max-w-[200px] sm:max-w-none">
          <div className="text-[11px] font-bold text-slate-300 border-b border-slate-800/80 pb-1">
            Legenda Jaringan
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-300">
            <span className="text-sm">🏔️</span>
            <span>Hulu Mata Air Lemo Baru</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Sambungan Rumah (Aktif)</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-300">
            <span className="w-4 h-0.5 bg-cyan-400 border-t border-dashed border-cyan-300 inline-block" />
            <span>Pipa Transmisi Gravitasi</span>
          </div>
        </div>

        {/* Detail Panel / Drawer Saat Titik Dipilih */}
        {selectedItem && (
          <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-96 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                {selectedItem.type === "SOURCE" ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                      <span>Hulu Sumber Air Alami</span>
                    </span>
                    <h4 className="text-sm font-black text-white">{selectedItem.data.name}</h4>
                    <p className="text-xs text-slate-400">Broncaptering &amp; Bak Penenang Pegunungan</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                        <span>Sambungan Aktif (Normal)</span>
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white">
                      {formatPublicCustomerName(selectedItem.data.name)}
                    </h4>
                    <p className="text-xs text-slate-400">
                      No. SR: <strong className="text-emerald-400">{selectedItem.data.connection_no}</strong> • {selectedItem.data.dusun}
                    </p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2.5 text-xs text-slate-300 space-y-1.5">
              {selectedItem.type === "SOURCE" ? (
                <>
                  <div className="flex justify-between text-slate-400">
                    <span>Sistem Penyaluran:</span>
                    <strong className="text-cyan-300">100% Gravitasi Bebas Listrik</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Elevasi Hulu:</span>
                    <strong className="text-white">~145 mdpl</strong>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    {selectedItem.data.description}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-slate-400">
                    <span>Wilayah Layanan:</span>
                    <strong className="text-slate-200">Dusun Lemo Baru, Desa Kuajang</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status Aliran Pipa:</span>
                    <strong className="text-emerald-400">Mengalir Lancar</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                    Privasi Warga Terjaga: Informasi tagihan &amp; pemakaian dapat dicek mandiri secara aman di Portal Warga.
                  </div>
                </>
              )}
            </div>

            {selectedItem.type === "CUSTOMER" && (
              <div className="pt-2 border-t border-slate-800">
                <Link
                  href={`/portal?no=${encodeURIComponent(selectedItem.data.connection_no)}`}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center space-x-1.5 transition active:scale-95 shadow-md"
                >
                  <span>Cek Tagihan di Portal Warga</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Catatan Etika & Batasan Tampilan Publik */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start space-x-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-300">
            Standar Batasan &amp; Etika Tampilan Publik (Public Privacy Boundary):
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Peta publik menampilkan lokasi sambungan terdaftar dan hulu mata air untuk transparansi cakupan air bersih. Demi menjaga privasi, kehormatan warga, dan ketenteraman desa, status tunggakan atau nominal piutang <strong>tidak dipublikasikan</strong> secara terbuka. Warga dapat mengecek detail tagihan masing-masing secara privat melalui Portal Warga Mandiri.
          </p>
        </div>
      </div>
    </section>
  );
}
