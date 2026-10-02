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

  const [mapType, setMapType] = useState<"google-hybrid" | "google-streets">("google-hybrid");
  const [activePopupCustomer, setActivePopupCustomer] = useState<DemoCustomer | null>(null);
  const [trackingGps, setTrackingGps] = useState(false);

  // Compute map center from customers
  const validCoords = customers.filter((c) => c.latitude && c.longitude);
  const defaultCenterLat =
    validCoords.length > 0 ? validCoords[0].latitude! : -3.4582;
  const defaultCenterLng =
    validCoords.length > 0 ? validCoords[0].longitude! : 119.3415;

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
      const lat = cust.latitude || -3.4582;
      const lng = cust.longitude || 119.3415;
      const isSelected = cust.id === selectedCustomerId;

      // Determine pin color based on billing status
      // Green = PAID, Red = UNPAID, Yellow = SEALED
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

      marker.on("click", () => {
        onSelectCustomer(cust);
        setActivePopupCustomer(cust);
        mapInstanceRef.current?.setView([lat, lng], 17, { animate: true });
      });

      markersLayer.addLayer(marker);
    });
  }, [customers, selectedCustomerId, onSelectCustomer]);

  // Center on selected customer
  useEffect(() => {
    const selected = customers.find((c) => c.id === selectedCustomerId);
    if (selected && selected.latitude && selected.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selected.latitude, selected.longitude], 17, {
        animate: true,
      });
      setActivePopupCustomer(selected);
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

  // Track Officer GPS Location on map
  const handleTrackMyLocation = () => {
    setTrackingGps(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setTrackingGps(false);

          if (!mapInstanceRef.current) return;

          if (myLocationMarkerRef.current) {
            myLocationMarkerRef.current.setLatLng([lat, lng]);
          } else {
            const officerIcon = L.divIcon({
              className: "officer-location-pin",
              html: `
                <div style="
                  width: 22px;
                  height: 22px;
                  background: #2563EB;
                  border: 3px solid #FFFFFF;
                  border-radius: 50%;
                  box-shadow: 0 0 14px #2563EB;
                "></div>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            });
            myLocationMarkerRef.current = L.marker([lat, lng], {
              icon: officerIcon,
            })
              .addTo(mapInstanceRef.current)
              .bindPopup("<b>Posisi Petugas Lapangan</b>")
              .openPopup();
          }

          mapInstanceRef.current.setView([lat, lng], 18, { animate: true });
        },
        () => {
          // Fallback simulation near Lemo Baru
          setTrackingGps(false);
          const simLat = -3.4585;
          const simLng = 119.3408;

          if (mapInstanceRef.current) {
            if (myLocationMarkerRef.current) {
              myLocationMarkerRef.current.setLatLng([simLat, simLng]);
            } else {
              const officerIcon = L.divIcon({
                className: "officer-location-pin",
                html: `
                  <div style="
                    width: 22px;
                    height: 22px;
                    background: #2563EB;
                    border: 3px solid #FFFFFF;
                    border-radius: 50%;
                    box-shadow: 0 0 14px #2563EB;
                  "></div>
                `,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
              });
              myLocationMarkerRef.current = L.marker([simLat, simLng], {
                icon: officerIcon,
              })
                .addTo(mapInstanceRef.current)
                .bindPopup("<b>Posisi Petugas (Simulasi Lapangan)</b>")
                .openPopup();
            }
            mapInstanceRef.current.setView([simLat, simLng], 18, { animate: true });
          }
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Compute status summary counts
  const totalPaid = customers.filter((c) => c.billingStatus === "PAID").length;
  const totalUnpaid = customers.filter(
    (c) => c.billingStatus === "UNPAID" && c.status !== "SEALED"
  ).length;
  const totalSealed = customers.filter((c) => c.status === "SEALED").length;

  return (
    <div className="space-y-3">
      {/* Map Header with Statistics and Layer Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Statistics Pills */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
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
        <div className="flex items-center space-x-2 self-end sm:self-auto">
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

          {/* GPS My Location */}
          <button
            type="button"
            onClick={handleTrackMyLocation}
            disabled={trackingGps}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition flex items-center space-x-1 active:scale-95 disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${trackingGps ? "animate-spin" : ""}`} />
            <span>Lokasi Saya</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-slate-300 shadow-xl bg-slate-900">
        <div
          ref={mapContainerRef}
          className="w-full h-80 sm:h-96 z-10"
          style={{ minHeight: "320px" }}
        />

        {/* Floating Active House Card on Map */}
        {activePopupCustomer && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm z-20 animate-in slide-in-from-bottom duration-200">
            <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border-2 border-slate-200 text-slate-800 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {activePopupCustomer.connectionNo}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                        activePopupCustomer.billingStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : activePopupCustomer.status === "SEALED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {activePopupCustomer.billingStatus === "PAID"
                        ? "✓ SUDAH LUNAS"
                        : activePopupCustomer.status === "SEALED"
                        ? "DISEGEL"
                        : "● BELUM BAYAR"}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mt-0.5">
                    {activePopupCustomer.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {activePopupCustomer.dusun} • Seri: {activePopupCustomer.meterSerial}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black font-tabular text-slate-800">
                    {activePopupCustomer.lastReading.toFixed(2)} m³
                  </div>
                  <div className="text-[9px] text-slate-400">Stand Lalu</div>
                </div>
              </div>

              {/* Action Button to Proceed to meter reading & collection */}
              {onProceedToRecord && (
                <button
                  type="button"
                  onClick={() => onProceedToRecord(activePopupCustomer)}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5 active:scale-95 ${
                    activePopupCustomer.billingStatus === "PAID"
                      ? "bg-slate-800 hover:bg-slate-900 text-white"
                      : "bg-brand-maroon-800 hover:bg-brand-maroon-900 text-white shadow-brand-maroon-900/30"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>
                    {activePopupCustomer.billingStatus === "PAID"
                      ? "Lihat / Catat Ulang Meter"
                      : "Catat Meter & Tagih Rumah Ini"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
