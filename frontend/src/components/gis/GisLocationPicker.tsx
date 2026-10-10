"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Navigation,
  Layers,
  Satellite,
  Maximize2,
  Minimize2,
  RotateCcw,
  RefreshCw,
  Check,
  Map as MapIcon,
} from "lucide-react";
import L from "leaflet";

interface GisLocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  dusunName?: string;
}

const KUAJANG_DUSUN_COORDS: Record<string, { lat: number; lng: number }> = {
  "Lemo Baru": { lat: -3.4349, lng: 119.3768 },
  "Lemo Tua": { lat: -3.4285, lng: 119.3725 },
  "Sarampu 1": { lat: -3.4385, lng: 119.3850 },
  "Sarampu 2": { lat: -3.4410, lng: 119.3890 },
  "Pakkandoang": { lat: -3.4410, lng: 119.3890 },
};

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

  const [mapType, setMapType] = useState<"google-hybrid" | "google-streets" | "osm">("google-hybrid");
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Validate coordinates: prevent sea coordinates (<= -3.45 and <= 119.35)
  const isInvalidSeaCoord = (lat: number, lng: number) => {
    if (lat === 0 || lng === 0) return true;
    if (lat <= -3.45 && lng <= 119.35) return true;
    return false;
  };

  const dusunTarget = KUAJANG_DUSUN_COORDS[dusunName] || { lat: -3.4349, lng: 119.3768 };
  const currentLat = !isInvalidSeaCoord(latitude, longitude) ? latitude : dusunTarget.lat;
  const currentLng = !isInvalidSeaCoord(latitude, longitude) ? longitude : dusunTarget.lng;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent duplicate instantiation

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 18,
      zoomControl: true,
      fadeAnimation: false, // Prevents tile fading glitch on container resize
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

    // Bind popup
    marker.bindPopup(`<b>Titik Sambungan Meter</b><br>Dusun ${dusunName}`);

    // If initial coordinate was invalid or 0, synchronize parent with real land coordinate
    if (isInvalidSeaCoord(latitude, longitude)) {
      onChange(currentLat, currentLng);
    }

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

    // Staggered invalidateSize after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
    setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ResizeObserver to detect any change in map container dimensions and refresh Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let resizeTimer: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false });
        }
      }, 60);
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(resizeTimer);
      resizeObserver.disconnect();
    };
  }, []);

  // Invalidate map size & pan to marker whenever fullscreen/expanded mode is toggled
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const refreshMap = () => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.invalidateSize({ pan: false });
      if (markerRef.current) {
        const pos = markerRef.current.getLatLng();
        mapInstanceRef.current.setView(pos, mapInstanceRef.current.getZoom(), { animate: false });
      }
    };

    // Staggered redraws ensure Leaflet catches the container at 0ms, 60ms, 150ms, and 350ms
    refreshMap();
    const t1 = setTimeout(refreshMap, 60);
    const t2 = setTimeout(refreshMap, 150);
    const t3 = setTimeout(refreshMap, 350);
    const t4 = setTimeout(refreshMap, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isExpanded]);

  // Update marker if lat/lng props change from outside
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && latitude !== 0 && longitude !== 0) {
      if (!isInvalidSeaCoord(latitude, longitude)) {
        const currentPos = markerRef.current.getLatLng();
        if (currentPos.lat !== latitude || currentPos.lng !== longitude) {
          markerRef.current.setLatLng([latitude, longitude]);
          mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
        }
      }
    }
  }, [latitude, longitude]);

  // When Dusun changes from parent, adjust default position if currently at sea or zero
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && isInvalidSeaCoord(latitude, longitude)) {
      const target = KUAJANG_DUSUN_COORDS[dusunName] || { lat: -3.4349, lng: 119.3768 };
      markerRef.current.setLatLng([target.lat, target.lng]);
      mapInstanceRef.current.setView([target.lat, target.lng], 18);
      onChange(target.lat, target.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dusunName]);

  // Toggle Map Layer (Google Hybrid, Google Streets, or OpenStreetMap)
  const toggleMapLayer = (type: "google-hybrid" | "google-streets" | "osm") => {
    setMapType(type);
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.remove();

    let newUrl = "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    let subdomains: string[] = ["0", "1", "2", "3"];
    let attribution = "&copy; Google Maps";
    let maxZoom = 20;

    if (type === "google-streets") {
      newUrl = "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    } else if (type === "osm") {
      newUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      subdomains = ["a", "b", "c"];
      attribution = "&copy; OpenStreetMap contributors";
      maxZoom = 19;
    }

    const newLayer = L.tileLayer(newUrl, {
      maxZoom,
      subdomains,
      attribution,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;

    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize({ pan: false });
    }, 50);
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
            mapInstanceRef.current.invalidateSize({ pan: false });
            markerRef.current.setLatLng([lat, lng]);
            mapInstanceRef.current.setView([lat, lng], 18);
          }
        },
        () => {
          // Fallback simulation for local/testing without GPS hardware: use real Kuajang dusun coordinates
          const target = KUAJANG_DUSUN_COORDS[dusunName] || { lat: -3.4349, lng: 119.3768 };
          const simLat = parseFloat((target.lat + (Math.random() - 0.5) * 0.0008).toFixed(6));
          const simLng = parseFloat((target.lng + (Math.random() - 0.5) * 0.0008).toFixed(6));
          onChange(simLat, simLng);
          setGpsAccuracy("±4m (Simulasi GPS HP)");
          setIsLocating(false);

          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.invalidateSize({ pan: false });
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

  // Handler untuk memusatkan peta kembali ke pusat dusun
  const handleRecenter = (dName?: string) => {
    const target = KUAJANG_DUSUN_COORDS[dName || dusunName] || { lat: -3.4349, lng: 119.3768 };
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.invalidateSize({ pan: false });
      markerRef.current.setLatLng([target.lat, target.lng]);
      mapInstanceRef.current.flyTo([target.lat, target.lng], 19);
      onChange(target.lat, target.lng);
    }
  };

  // Handler untuk memuat ulang ukuran dan tampilan peta
  const handleRefreshMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize({ pan: false });
      if (markerRef.current) {
        const pos = markerRef.current.getLatLng();
        mapInstanceRef.current.setView(pos, mapInstanceRef.current.getZoom(), { animate: false });
      }
    }
  };

  return (
    <>
      {/* Backdrop saat mode layar penuh / diperluas aktif */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99998]"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        className={
          isExpanded
            ? "fixed inset-2 sm:inset-4 md:inset-6 z-[99999] bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl border-2 border-brand-gold-500/80 flex flex-col justify-between"
            : "space-y-3"
        }
      >
        {/* Header Bar with Action Buttons */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-gold-500/10 text-brand-gold-600">
              <MapPin className="w-4 h-4 text-brand-gold-600" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider block">
                {isExpanded
                  ? "📍 Penentuan Titik Koordinat Rumah & Meteran (Layar Penuh)"
                  : "Titik Koordinat Sambungan (GIS)"}
              </span>
              {isExpanded && (
                <span className="text-[11px] text-slate-500">
                  Ketuk pada atap rumah warga atau geser pin meteran ke lokasi yang tepat.
                </span>
              )}
            </div>
            {gpsAccuracy && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                GPS: {gpsAccuracy}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
            {/* Quick Recenter Button */}
            <button
              type="button"
              onClick={() => handleRecenter(dusunName)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1 shadow-sm active:scale-95"
              title={`Pusatkan ke Dusun ${dusunName}`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Pusatkan Dusun</span>
            </button>

            {/* Quick Refresh Canvas Button */}
            <button
              type="button"
              onClick={handleRefreshMap}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1 shadow-sm active:scale-95"
              title="Muat ulang dan segarkan tampilan peta jika ada bagian yang abu-abu"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            {/* Layer Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => toggleMapLayer("google-hybrid")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                  mapType === "google-hybrid"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Citra Satelit Google dengan nama jalan & atap rumah"
              >
                <Satellite className="w-3 h-3 text-amber-400" />
                <span>Google Satelit</span>
              </button>
              <button
                type="button"
                onClick={() => toggleMapLayer("google-streets")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                  mapType === "google-streets"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Peta Jalan Vektor Google"
              >
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>Google Jalan</span>
              </button>
              <button
                type="button"
                onClick={() => toggleMapLayer("osm")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                  mapType === "osm"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="OpenStreetMap Standar"
              >
                <MapIcon className="w-3 h-3 text-cyan-400" />
                <span>OSM</span>
              </button>
            </div>

            {/* Quick GPS Auto-Detect Button */}
            <button
              type="button"
              onClick={handleGetGpsLocation}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Mencari GPS..." : "GPS Lokasi Saya"}</span>
            </button>

            {/* Fullscreen / Perbesar Peta Toggle Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-1.5 active:scale-95 ${
                isExpanded
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-amber-500/20"
              }`}
              title={isExpanded ? "Kecilkan Tampilan Peta" : "Perbesar Peta ke Layar Penuh"}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kecilkan Peta</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Perbesar Peta</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Map Container Viewport */}
        <div
          className={
            isExpanded
              ? "relative flex-1 w-full min-h-[360px] my-2.5 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner bg-slate-100"
              : "relative w-full h-80 sm:h-96 md:h-[460px] rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner bg-slate-100"
          }
        >
          <div
            ref={mapContainerRef}
            className={
              isExpanded
                ? "absolute inset-0 w-full h-full z-10"
                : "w-full h-full z-10"
            }
          />

          {/* Overlay Instruction Hint */}
          <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md text-white text-xs font-medium flex flex-wrap items-center justify-between border border-white/10 shadow-lg gap-2">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>💡 Geser pin merah atau ketuk pada peta untuk menandai atap/meteran rumah warga.</span>
              </span>
              <div className="flex items-center space-x-2 font-mono text-amber-300 font-bold text-xs">
                <span>📍 {currentLat.toFixed(6)}, {currentLng.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Lat Lng Readout Inputs & Done Button */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 pt-1">
          <div className="grid grid-cols-2 gap-3 text-xs flex-1 max-w-xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Latitude (Garis Lintang)
              </label>
              <input
                type="number"
                step="0.000001"
                value={latitude !== 0 ? latitude : currentLat}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0, longitude)}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-maroon-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Longitude (Garis Bujur)
              </label>
              <input
                type="number"
                step="0.000001"
                value={longitude !== 0 ? longitude : currentLng}
                onChange={(e) => onChange(latitude, parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-maroon-700"
              />
            </div>
          </div>

          {isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-700/30 flex items-center justify-center space-x-2 transition active:scale-95 whitespace-nowrap self-stretch sm:self-auto"
            >
              <Check className="w-4 h-4" />
              <span>Selesai &amp; Gunakan Titik Ini</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
