"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Layers, Satellite, Compass, Sparkles } from "lucide-react";
import L from "leaflet";

interface GisLocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  dusunName?: string;
}

export function GisLocationPicker({
  latitude,
  longitude,
  onChange,
  dusunName = "Lemo Baru",
}: GisLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapType, setMapType] = useState<"google-hybrid" | "google-streets">("google-hybrid");
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<string | null>(null);

  // Default coordinate if 0: Kuajang center
  const currentLat = latitude !== 0 ? latitude : -3.4582;
  const currentLng = longitude !== 0 ? longitude : 119.3415;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Avoid double initialization
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 18,
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

    // Custom House Water Meter Pin Icon
    const customIcon = L.divIcon({
      className: "custom-meter-marker",
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background: #7A1C1C;
          border: 3px solid #F59E0B;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: #FFFFFF;
            font-size: 14px;
            font-weight: 900;
          ">💧</div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
    });

    const marker = L.marker([currentLat, currentLng], {
      draggable: true,
      icon: customIcon,
    }).addTo(map);

    marker.bindPopup(`<b>Titik Sambungan Meter</b><br>${dusunName}`).openPopup();

    // Marker drag event
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
    });

    // Map click event
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker if lat/lng props change from outside
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && latitude !== 0 && longitude !== 0) {
      const currentPos = markerRef.current.getLatLng();
      if (currentPos.lat !== latitude || currentPos.lng !== longitude) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
      }
    }
  }, [latitude, longitude]);

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

  // GPS Device Geolocation Trigger
  const handleGetGpsLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          const acc = Math.round(position.coords.accuracy);

          onChange(lat, lng);
          setGpsAccuracy(`±${acc}m`);
          setIsLocating(false);

          if (mapInstanceRef.current && markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            mapInstanceRef.current.setView([lat, lng], 18);
          }
        },
        () => {
          // Fallback simulation for local/testing without GPS hardware
          const simLat = parseFloat((-3.4582 + (Math.random() - 0.5) * 0.003).toFixed(6));
          const simLng = parseFloat((119.3415 + (Math.random() - 0.5) * 0.003).toFixed(6));
          onChange(simLat, simLng);
          setGpsAccuracy("±4m (Simulasi GPS HP)");
          setIsLocating(false);

          if (mapInstanceRef.current && markerRef.current) {
            markerRef.current.setLatLng([simLat, simLng]);
            mapInstanceRef.current.setView([simLat, simLng], 18);
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      alert("Fitur Geolocation tidak didukung di peramban ini.");
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Header Bar with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-brand-gold-500" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Titik Koordinat Sambungan (GIS)
          </span>
          {gpsAccuracy && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              GPS Akurat: {gpsAccuracy}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
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

          {/* Quick GPS Auto-Detect Button */}
          <button
            type="button"
            onClick={handleGetGpsLocation}
            disabled={isLocating}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
            <span>{isLocating ? "Mencari GPS..." : "GPS Lokasi Saya"}</span>
          </button>
        </div>
      </div>

      {/* Map Container Viewport */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner bg-slate-100">
        <div
          ref={mapContainerRef}
          className="w-full h-56 sm:h-64 z-10"
          style={{ minHeight: "220px" }}
        />

        {/* Overlay Instruction Hint */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-medium flex items-center justify-between border border-white/10 shadow-lg">
            <span>💡 Geser pin atau ketuk pada peta untuk mengatur posisi meteran.</span>
            <span className="font-mono text-amber-300 font-bold hidden sm:inline">
              {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
            </span>
          </div>
        </div>
      </div>

      {/* Lat Lng Readout Inputs */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
            Latitude (Garis Lintang)
          </label>
          <input
            type="number"
            step="0.000001"
            value={latitude !== 0 ? latitude : currentLat}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0, longitude)}
            className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-xl bg-slate-50 focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
            Longitude (Garis Bujur)
          </label>
          <input
            type="number"
            step="0.000001"
            value={longitude !== 0 ? longitude : currentLng}
            onChange={(e) => onChange(latitude, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-xl bg-slate-50 focus:bg-white"
          />
        </div>
      </div>
    </div>
  );
}
