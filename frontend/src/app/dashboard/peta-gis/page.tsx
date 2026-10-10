"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { MasterGisCustomer } from "@/types/gis";
import {
  Map,
  Compass,
  Droplets,
  Layers,
  Sparkles,
  RefreshCw,
  Smartphone,
  AlertCircle,
  Users,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight,
  Gauge,
} from "lucide-react";

const MasterDesaGisMap = dynamic(
  () => import("@/components/gis/MasterDesaGisMap").then((m) => m.MasterDesaGisMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-10 h-10 rounded-full border-3 border-brand-gold-500 border-t-transparent animate-spin" />
        <span className="animate-pulse text-sm font-semibold">
          Memuat Peta Satelit Master GIS Sebaran Sambungan Rumah Warga Desa Kuajang...
        </span>
      </div>
    ),
  }
);

export default function PetaGisPage() {
  const { user, isDesaLevel, activeKpspamsId } = useAuth();
  const [customers, setCustomers] = useState<MasterGisCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Ambil Data Terkini dari API Backend (Pelanggan, Tagihan, Pengaduan, dan Kondisi Meteran Riil)
  const fetchAllGisData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Ambil data pengaduan aktif
      const complaintsMap: Record<number, any> = {};
      const complaintsByConnNo: Record<string, any> = {};
      try {
        const compRes = await apiClient("/complaints?per_page=100");
        if (compRes?.status === "success" && Array.isArray(compRes.data)) {
          compRes.data.forEach((c: any) => {
            if (["OPEN", "SUBMITTED", "VERIFIED", "IN_PROGRESS"].includes(c.status)) {
              const compObj = {
                id: Number(c.id),
                ticketNumber: c.ticket_number,
                category: c.category || "GANGGUAN_AIR",
                description: c.description || "Laporan gangguan air bersih",
                priority: c.priority || "MEDIUM",
                status: c.status,
                createdAt: c.created_at,
              };
              if (c.customer_id) complaintsMap[Number(c.customer_id)] = compObj;
              if (c.connection?.connection_no) complaintsByConnNo[c.connection.connection_no] = compObj;
            }
          });
        }
      } catch (cErr) {
        console.warn("GisPage: fetch complaints fallback", cErr);
      }

      // 2. Ambil data tagihan aktif (Unpaid invoices)
      const unpaidMap: Record<number, number> = {};
      try {
        const invRes = await apiClient("/invoices?status=UNPAID&per_page=100");
        if (invRes?.status === "success" && Array.isArray(invRes.data)) {
          invRes.data.forEach((inv: any) => {
            if (inv.customer_id) {
              unpaidMap[Number(inv.customer_id)] = Number(inv.total_amount) || 10000;
            }
          });
        }
      } catch (iErr) {
        console.warn("GisPage: fetch invoices fallback", iErr);
      }

      // 3. Ambil data sambungan & koordinat pelanggan riil dari database
      const custRes = await apiClient("/customers?per_page=200");
      if (custRes?.status === "success" && Array.isArray(custRes.data) && custRes.data.length > 0) {
        const liveCustomers: MasterGisCustomer[] = custRes.data.map((c: any) => {
          const primaryConn = c.connections?.[0];
          const rawLat =
            c.latitude !== null && c.latitude !== undefined
              ? Number(c.latitude)
              : primaryConn?.latitude
              ? Number(primaryConn.latitude)
              : null;
          const rawLng =
            c.longitude !== null && c.longitude !== undefined
              ? Number(c.longitude)
              : primaryConn?.longitude
              ? Number(primaryConn.longitude)
              : null;

          // Koordinat default dusun Lemo Baru jika belum ada pin GPS
          const finalLat =
            rawLat && rawLat !== 0 && rawLat > -3.45 ? rawLat : -3.4328;
          const finalLng =
            rawLng && rawLng !== 0 && rawLng > 119.35 ? rawLng : 119.3755;

          const connNo =
            primaryConn?.connection_no ||
            primaryConn?.connection_number ||
            c.connection_no ||
            `SR-${c.id}`;

          const isUnpaid =
            unpaidMap[c.id] !== undefined ||
            c.billing_status === "UNPAID";

          const activeComp =
            complaintsMap[c.id] || complaintsByConnNo[connNo] || null;

          const cond = c.meter_condition || primaryConn?.meter?.condition || "GOOD";
          const isDamaged =
            cond === "STUCK" || cond === "DAMAGED" || Boolean(c.is_meter_damaged);

          return {
            id: c.id,
            connectionNo: connNo,
            name: c.full_name || c.name || "Warga",
            nik: c.nik,
            phone: c.phone,
            dusun: c.dusun || primaryConn?.dusun?.name || "Lemo Baru",
            rtRw: c.rt_rw || "-",
            kpspamsId: Number(c.kpspams_id || 1),
            kpspamsName:
              c.kpspams_name ||
              c.kpspams?.name ||
              (Number(c.kpspams_id) === 1 ? "KPSPAMS Lemo Baru" : `KPSPAMS Unit ${c.kpspams_id}`),
            meterSerial:
              c.meter_serial || primaryConn?.meter?.serial_number || `MTR-${c.id}`,
            lastReading: Number(c.last_reading ?? primaryConn?.meter?.current_reading ?? 100),
            tariffType: c.customer_type?.name || "Rumah Tangga",
            latitude: finalLat,
            longitude: finalLng,
            billingStatus: isUnpaid ? "UNPAID" : "PAID",
            unpaidAmount: isUnpaid ? unpaidMap[c.id] || 10000 : 0,
            meterCondition: cond,
            isMeterDamaged: isDamaged,
            activeComplaint: activeComp,
          };
        });

        setCustomers(liveCustomers);
      }
    } catch (err) {
      console.warn("Gagal fetch data GIS lengkap:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllGisData();
  }, [fetchAllGisData]);

  // Multi-tenant Filter
  const effectiveKpspamsId =
    !isDesaLevel && user?.kpspamsId
      ? Number(user.kpspamsId)
      : activeKpspamsId !== null && activeKpspamsId !== undefined
      ? Number(activeKpspamsId)
      : 1;

  const displayCustomers = useMemo(() => {
    if (isDesaLevel || effectiveKpspamsId === null) return customers;
    return customers.filter((c) => Number(c.kpspamsId) === Number(effectiveKpspamsId));
  }, [customers, isDesaLevel, effectiveKpspamsId]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        {/* Header Hero Section */}
        <div className="bg-gradient-to-r from-brand-maroon-900 via-slate-900 to-black text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-brand-maroon-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-gold-500/20 text-brand-gold-300 border border-brand-gold-500/30 text-xs font-bold">
                <Compass className="w-3.5 h-3.5 text-brand-gold-400" />
                <span>Geographic Information System (GIS) • Desa Kuajang</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-3">
                <Map className="w-8 h-8 text-brand-gold-400" />
                <span>Peta GIS Sambungan Rumah &amp; Kondisi Fisik Meteran</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Pemantauan spasial riil seluruh titik Sambungan Rumah (SR) warga Desa Kuajang,
                status kelancaran putaran jarum meter air, deteksi meteran macet/rusak yang perlu diganti,
                serta status pembayaran iuran warga secara langsung dari lapangan.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={fetchAllGisData}
                disabled={isLoading}
                className="flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-sm transition border border-white/10"
                title="Sinkronkan data GIS realtime dari database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand-gold-400" : ""}`} />
                <span>Segarkan Peta</span>
              </button>

              <Link
                href="/dashboard/penagihan-lapangan"
                className="flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-950/40 transition"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Catat &amp; Tagih Lapangan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Master GIS Leaflet Satellite Map Component */}
        <MasterDesaGisMap
          customers={displayCustomers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={(cust) => setSelectedCustomerId(cust.id)}
        />
      </div>
    </DashboardLayout>
  );
}
