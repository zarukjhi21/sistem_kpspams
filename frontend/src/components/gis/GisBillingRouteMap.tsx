"use client";

import React, { useEffect, useRef, useState } from "react";
import { DemoCustomer } from "@/lib/demo-data";
import {
  MapPin,
  Layers,
  Satellite,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  Shield,
  Radio,
  Crosshair,
  Maximize2,
  Minimize2,
} from "lucide-react";
import L from "leaflet";

interface GisBillingRouteMapProps {
  customers: DemoCustomer[];
  selectedCustomerId: number;
  onSelectCustomer: (customer: DemoCustomer) => void;
  onProceedToRecord?: (customer: DemoCustomer) => void;
}

export function GisBillingRouteMap({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onProceedToRecord,
}: GisBillingRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const myLocationMarkerRef = useRef<L.Marker | null>(null);
  const myLocationAccuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [mapType, setMapType] = useState<"google-hybrid" | "google-streets">("google-hybrid");
  const [trackingGps, setTrackingGps] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [officerCoords, setOfficerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isInvalidSeaCoord = (lat?: number | null, lng?: number | null) => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) return true;
    if (lat === 0 || lng === 0) return true;
    if (lat <= -3.45 && lng <= 119.35) return true;
    return false;
  };

  // Compute map center from customers (excluding sea coordinates)
  const validCoords = customers.filter((c) => c.latitude && c.longitude && !isInvalidSeaCoord(c.latitude, c.longitude));
  const defaultCenterLat =
    validCoords.length > 0 ? validCoords[0].latitude! : -3.4349;
  const defaultCenterLng =
    validCoords.length > 0 ? validCoords[0].longitude! : 119.3768;

  // Haversine formula to calculate distance in meters
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [defaultCenterLat, defaultCenterLng],
      zoom: 17,
      zoomControl: true,
    });

    // Default tile: Google Maps Hybrid (Satellite Imagery + Street Names & Labels)
    const googleHybridUrl = "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    const tileLayer = L.tileLayer(googleHybridUrl, {
      maxZoom: 20,
      subdomains: ["0", "1", "2", "3"],
      attribution: "&copy; Google Maps",
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Markers when customers or selectedCustomerId change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    customers.forEach((cust) => {
      const rawLat = cust.latitude;
      const rawLng = cust.longitude;
      const isSea = isInvalidSeaCoord(rawLat, rawLng);
      const lat = !isSea ? rawLat! : -3.4349;
      const lng = !isSea ? rawLng! : 119.3768;
      const isSelected = cust.id === selectedCustomerId;

      // Determine pin color based on billing status
      const isPaid = cust.billingStatus === "PAID";
      const isSealed = cust.status === "SEALED";

      const bgColor = isSealed ? "#F59E0B" : isPaid ? "#10B981" : "#EF4444";
      const borderColor = isSelected ? "#FCD34D" : "#FFFFFF";
      const pulseHtml = isSelected
        ? `<div style="position: absolute; top: -6px; left: -6px; width: 44px; height: 44px; border-radius: 50%; border: 3px solid #F59E0B; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
        : "";

      const pinIcon = L.divIcon({
        className: "custom-gis-pin",
        html: `
          <div style="position: relative; width: 32px; height: 32px;">
            ${pulseHtml}
            <div style="
              width: 32px;
              height: 32px;
              background: ${bgColor};
              border: 3px solid ${borderColor};
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
                color: #FFFFFF;
                font-size: 11px;
                font-weight: 900;
              ">
                ${isPaid ? "✓" : isSealed ? "!" : "Rp"}
              </div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 170px; padding: 2px;">
          <div style="font-weight: 800; color: #0f172a; font-size: 13px;">${cust.name}</div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 2px;">
            ${cust.connectionNo} • ${cust.dusun}
          </div>
          <div style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px; background: ${
              isPaid ? '#d1fae5; color: #065f46;' : isSealed ? '#fef3c7; color: #92400e;' : '#fee2e2; color: #991b1b;'
            }">
              ${isPaid ? '✓ Sudah Lunas' : isSealed ? '⚠ Disegel' : '● Belum Bayar'}
            </span>
            <span style="font-size: 11px; font-weight: 800; font-family: monospace; color: #0f172a;">
              ${cust.lastReading.toFixed(1)} m³
            </span>
          </div>
          <div style="font-size: 10px; color: #2563eb; font-weight: 700; margin-top: 6px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
            Data lengkap di bawah peta ↓
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        offset: [0, -28],
        closeButton: true,
      });

      marker.on("click", () => {
        onSelectCustomer(cust);
        marker.openPopup();
        mapInstanceRef.current?.setView([lat, lng], 18, { animate: true });
      });

      markersLayer.addLayer(marker);
    });
  }, [customers, selectedCustomerId, onSelectCustomer]);

  // Center on selected customer
  useEffect(() => {
    const selected = customers.find((c) => c.id === selectedCustomerId);
    if (selected && selected.latitude && selected.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selected.latitude, selected.longitude], 18, {
        animate: true,
      });
    }
  }, [selectedCustomerId, customers]);

  // Toggle Map Layer (Google Hybrid vs Google Streets)
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

  // Update Officer Location on map with satellite accuracy circle
  const updateOfficerPosition = (lat: number, lng: number, accuracy: number) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    setOfficerCoords({ lat, lng });
    setGpsAccuracy(Math.round(accuracy));
    setGpsError(null);

    // 1. Update Officer Marker
    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const officerIcon = L.divIcon({
        className: "officer-location-pin",
        html: `
          <div style="position: relative; width: 28px; height: 28px;">
            <div style="position: absolute; top: -6px; left: -6px; width: 40px; height: 40px; border-radius: 50%; background: rgba(37, 99, 235, 0.3); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 28px; height: 28px; background: #2563EB; border: 3px solid #FFFFFF; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
              <div style="width: 8px; height: 8px; background: #FFFFFF; border-radius: 50%;"></div>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      myLocationMarkerRef.current = L.marker([lat, lng], {
        icon: officerIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    // 2. Update Accuracy Circle (visual radius)
    if (myLocationAccuracyCircleRef.current) {
      myLocationAccuracyCircleRef.current.setLatLng([lat, lng]);
      myLocationAccuracyCircleRef.current.setRadius(accuracy);
    } else {
      myLocationAccuracyCircleRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: "#2563EB",
        weight: 1.5,
        fillColor: "#3B82F6",
        fillOpacity: 0.15,
      }).addTo(map);
    }

    myLocationMarkerRef.current.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 2px;">
        <div style="font-weight: 800; color: #1e3a8a;">📍 Posisi Petugas Lapangan</div>
        <div style="font-size: 11px; color: #16a34a; font-weight: 700; margin-top: 3px;">
          ✓ Sinyal GPS Terkunci
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
          Radius Akurasi: ±${Math.round(accuracy)} meter
        </div>
      </div>
    `);
  };

  // High Accuracy Hardware Geolocation (No Stale Cache, No Fake Coordinates)
  const handleTrackMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setGpsError("Browser di perangkat ini tidak mendukung sensor GPS.");
      return;
    }

    setTrackingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setTrackingGps(false);
        updateOfficerPosition(latitude, longitude, accuracy);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 18, { animate: true });
        }
      },
      (err) => {
        setTrackingGps(false);
        let msg = "Gagal membaca sinyal GPS.";
        if (err.code === 1) {
          msg = "Izin lokasi GPS belum diizinkan. Silakan aktifkan izin lokasi di pengaturan browser HP.";
        } else if (err.code === 2) {
          msg = "Sinyal satelit GPS tidak terdeteksi. Pastikan GPS HP aktif dan Anda berada di area terbuka.";
        } else if (err.code === 3) {
          msg = "Waktu pencarian satelit habis (timeout). Silakan ketuk tombol Lokasi Saya kembali.";
        }
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true, // Forces phone's real GNSS/GPS chipset!
        timeout: 20000,
        maximumAge: 0, // Never use stale cache!
      }
    );
  };

  // Toggle Live Tracking (Continuous GPS Watch while walking in the field)
  const toggleLiveTracking = () => {
    if (isLiveTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveTracking(false);
    } else {
      if (!("geolocation" in navigator)) {
        setGpsError("Browser ini tidak mendukung sensor GPS.");
        return;
      }
      setIsLiveTracking(true);
      setGpsError(null);

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          updateOfficerPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        },
        (err) => {
          console.warn("Live watch GPS warning:", err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 25000,
        }
      );
      watchIdRef.current = id;
    }
  };

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Resize Leaflet map when toggling fullscreen
  useEffect(() => {
    const t1 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 100);
    const t2 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isFullscreen]);

  // Lock body scroll and listen for Escape key in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  // Calculate distance from officer to currently selected customer
  const selectedCust = customers.find((c) => c.id === selectedCustomerId);
  const distanceToTarget =
    officerCoords && selectedCust?.latitude && selectedCust?.longitude
      ? calculateDistanceMeters(
          officerCoords.lat,
          officerCoords.lng,
          selectedCust.latitude,
          selectedCust.longitude
        )
      : null;

  // Compute status summary counts
  const totalPaid = customers.filter((c) => c.billingStatus === "PAID").length;
  const totalUnpaid = customers.filter(
    (c) => c.billingStatus === "UNPAID" && c.status !== "SEALED"
  ).length;
  const totalSealed = customers.filter((c) => c.status === "SEALED").length;

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] w-screen h-screen bg-slate-950 p-2 sm:p-3 flex flex-col overflow-hidden animate-in fade-in duration-150"
          : "space-y-3"
      }
    >
      {/* Map Header with Statistics and Layer Switcher */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
          isFullscreen
            ? "bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex-shrink-0"
            : ""
        }`}
      >
        {/* Statistics Pills & Exit Button (when in Fullscreen) */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {isFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md flex items-center space-x-1.5 transition active:scale-95"
              title="Keluar Layar Penuh (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Keluar Full Layar (Esc)</span>
            </button>
          )}

          <div className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 font-bold flex items-center space-x-1.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Belum Bayar: {totalUnpaid} Rumah</span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center space-x-1.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Sudah Lunas: {totalPaid} Rumah</span>
          </div>
          {totalSealed > 0 && (
            <div className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-bold flex items-center space-x-1.5 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Segel: {totalSealed}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          {/* Layer Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => toggleMapLayer("google-hybrid")}
              className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 ${
                mapType === "google-hybrid"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Satellite className="w-3 h-3 text-amber-400" />
              <span>Google Satelit</span>
            </button>
            <button
              type="button"
              onClick={() => toggleMapLayer("google-streets")}
              className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 ${
                mapType === "google-streets"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Google Jalan</span>
            </button>
          </div>

          {/* Distance Indicator to selected customer */}
          {distanceToTarget !== null && (
            <div
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center space-x-1.5 shadow-sm ${
                distanceToTarget <= 25
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 animate-pulse"
                  : "bg-blue-50 border-blue-300 text-blue-800"
              }`}
              title="Perkiraan jarak dari posisi petugas ke rumah pelanggan terpilih"
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {distanceToTarget <= 25
                  ? `Di Lokasi (±${distanceToTarget}m)`
                  : `Jarak: ${distanceToTarget}m`}
              </span>
            </div>
          )}

          {/* GPS Accuracy Pill */}
          {gpsAccuracy !== null && (
            <div
              className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-semibold flex items-center space-x-1"
              title="Radius akurasi pembacaan satelit GPS saat ini"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>±{gpsAccuracy}m</span>
            </div>
          )}

          {/* GPS My Location Button */}
          <button
            type="button"
            onClick={handleTrackMyLocation}
            disabled={trackingGps}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition flex items-center space-x-1 active:scale-95 disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${trackingGps ? "animate-spin" : ""}`} />
            <span>{trackingGps ? "Mencari GPS..." : "Lokasi Saya"}</span>
          </button>

          {/* Live Tracking Toggle (Walking Mode) */}
          <button
            type="button"
            onClick={toggleLiveTracking}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border shadow-xs ${
              isLiveTracking
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md animate-pulse"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            title={isLiveTracking ? "Matikan Mode Lacak Langkah" : "Aktifkan Mode Lacak Langkah (Otomatis Ikuti Pergerakan Petugas)"}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isLiveTracking ? "Lacak Aktif" : "Lacak Bergerak"}</span>
          </button>

          {/* Fullscreen Toggle Button in Toolbar */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border shadow-xs active:scale-95 ${
              isFullscreen
                ? "bg-rose-600 text-white border-rose-500 hover:bg-rose-700"
                : "bg-slate-900 text-white border-slate-700 hover:bg-black"
            }`}
            title={isFullscreen ? "Keluar Layar Penuh (Esc)" : "Tampilkan Peta Layar Penuh"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Keluar</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Full Layar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in flex-shrink-0">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGpsError(null)}
            className="text-xs text-rose-500 hover:text-rose-800 font-bold ml-3 px-2 py-0.5 rounded hover:bg-rose-100"
          >
            ✕ Tutup
          </button>
        </div>
      )}

      {/* Main Map Viewport */}
      <div
        className={
          isFullscreen
            ? "relative flex-1 w-full min-h-0 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 mt-1"
            : "relative rounded-3xl overflow-hidden border-2 border-slate-300 shadow-xl bg-slate-900"
        }
      >
        <div
          ref={mapContainerRef}
          className={
            isFullscreen
              ? "w-full h-full z-10"
              : "w-full h-[420px] sm:h-[480px] lg:h-[520px] z-10"
          }
          style={isFullscreen ? { width: "100%", height: "100%" } : { minHeight: "400px" }}
        />

        {/* Floating Quick Fullscreen Toggle Button on Top-Right of Map Canvas */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`absolute top-3 right-3 z-[1000] px-2.5 py-1.5 rounded-xl shadow-lg border text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 backdrop-blur-xs ${
            isFullscreen
              ? "bg-slate-900/90 hover:bg-slate-900 text-rose-400 border-slate-700 hover:text-rose-300"
              : "bg-white/95 hover:bg-white text-slate-800 border-slate-200"
          }`}
          title={isFullscreen ? "Keluar Full Layar (Esc)" : "Maksimalkan Peta Layar Penuh"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Perkecil (Esc)</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Full Layar</span>
            </>
          )}
        </button>
      </div>

      {/* Fullscreen Quick Action Drawer when a customer is selected */}
      {isFullscreen && selectedCust && (
        <div className="mt-1 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl flex-shrink-0 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-sm truncate">
                {selectedCust.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-brand-gold-400 border border-slate-700 font-bold">
                {selectedCust.connectionNo}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  selectedCust.billingStatus === "PAID"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : selectedCust.status === "SEALED"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}
              >
                {selectedCust.billingStatus === "PAID"
                  ? "✓ Lunas"
                  : selectedCust.status === "SEALED"
                  ? "⚠ Segel"
                  : "● Belum Bayar"}
              </span>
            </div>
            <div className="text-xs text-slate-400 truncate mt-1 flex items-center space-x-2">
              <span>{selectedCust.dusun}</span>
              <span>•</span>
              <span className="text-slate-300 font-mono">Stand: {selectedCust.lastReading.toFixed(1)} m³</span>
              {distanceToTarget !== null && (
                <>
                  <span>•</span>
                  <span className={`font-bold ${distanceToTarget <= 25 ? "text-emerald-400 animate-pulse" : "text-blue-400"}`}>
                    Jarak: {distanceToTarget <= 25 ? `Di Lokasi (±${distanceToTarget}m)` : `±${distanceToTarget}m`}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-auto">
            {onProceedToRecord && (
              <button
                type="button"
                onClick={() => {
                  setIsFullscreen(false);
                  onProceedToRecord(selectedCust);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg flex items-center space-x-1.5 active:scale-95 transition"
              >
                <span>Catat Meter &amp; Tagih</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
