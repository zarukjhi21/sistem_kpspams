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
import {
  MasterGisCustomer,
  ReservoirSourceItem,
  VILLAGE_RESERVOIRS,
} from "@/types/gis";
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
  Mountain,
  ChevronRight,
  Printer,
} from "lucide-react";

// Baseline Data Riil 37 Titik Sambungan Rumah Warga Lemo Baru (Database Neon)
const BASELINE_CUSTOMERS: MasterGisCustomer[] = [
  { id: 9, connectionNo: "SR-LMB-00009", name: "SYAHARUDDIN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1009", lastReading: 154.2, tariffType: "Rumah Tangga", latitude: -3.432611, longitude: 119.37528, billingStatus: "PAID", activeComplaint: null },
  { id: 14, connectionNo: "SR-LMB-00014", name: "DINA", dusun: "Lemo Baru", rtRw: "-/-", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1014", lastReading: 98.4, tariffType: "Rumah Tangga", latitude: -3.43495, longitude: 119.37417, billingStatus: "PAID", activeComplaint: null },
  { id: 15, connectionNo: "SR-LMB-00015", name: "SABIR", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1015", lastReading: 112.0, tariffType: "Rumah Tangga", latitude: -3.434955, longitude: 119.374248, billingStatus: "PAID", activeComplaint: null },
  { id: 16, connectionNo: "SR-LMB-00016", name: "HARMAN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1016", lastReading: 88.5, tariffType: "Rumah Tangga", latitude: -3.431124, longitude: 119.378249, billingStatus: "PAID", activeComplaint: null },
  { id: 18, connectionNo: "SR-LMB-00018", name: "USMAN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1018", lastReading: 143.1, tariffType: "Rumah Tangga", latitude: -3.431192, longitude: 119.376299, billingStatus: "PAID", activeComplaint: null },
  { id: 19, connectionNo: "SR-LMB-00019", name: "SAHARULLAH. M", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1019", lastReading: 76.8, tariffType: "Rumah Tangga", latitude: -3.431117, longitude: 119.375994, billingStatus: "PAID", activeComplaint: null },
  { id: 20, connectionNo: "SR-LMB-00020", name: "NUR ALIM", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1020", lastReading: 129.0, tariffType: "Rumah Tangga", latitude: -3.431052, longitude: 119.37589, billingStatus: "PAID", activeComplaint: null },
  { id: 21, connectionNo: "SR-LMB-00021", name: "HAERATI", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1021", lastReading: 65.2, tariffType: "Rumah Tangga", latitude: -3.434728, longitude: 119.374299, billingStatus: "PAID", activeComplaint: null },
  { id: 22, connectionNo: "SR-LMB-00022", name: "SALMIA", dusun: "Lemo Baru", rtRw: "-/-", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1022", lastReading: 114.7, tariffType: "Rumah Tangga", latitude: -3.43254, longitude: 119.373731, billingStatus: "PAID", activeComplaint: null },
  { id: 23, connectionNo: "SR-LMB-00023", name: "HARIANA", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1023", lastReading: 82.3, tariffType: "Rumah Tangga", latitude: -3.432283, longitude: 119.373764, billingStatus: "PAID", activeComplaint: null },
  { id: 24, connectionNo: "SR-LMB-00024", name: "JUDDIN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1024", lastReading: 104.9, tariffType: "Rumah Tangga", latitude: -3.432608, longitude: 119.373888, billingStatus: "PAID", activeComplaint: null },
  { id: 25, connectionNo: "SR-LMB-00025", name: "HASMIA", dusun: "Lemo Baru", rtRw: "-/-", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1025", lastReading: 91.2, tariffType: "Rumah Tangga", latitude: -3.432466, longitude: 119.374041, billingStatus: "PAID", activeComplaint: null },
  { id: 26, connectionNo: "SR-LMB-00026", name: "SUMARNI", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1026", lastReading: 135.4, tariffType: "Rumah Tangga", latitude: -3.43279, longitude: 119.374909, billingStatus: "PAID", activeComplaint: null },
  { id: 27, connectionNo: "SR-LMB-00027", name: "SANA", dusun: "Lemo Baru", rtRw: "-/-", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1027", lastReading: 58.1, tariffType: "Rumah Tangga", latitude: -3.432854, longitude: 119.374956, billingStatus: "PAID", activeComplaint: null },
  { id: 28, connectionNo: "SR-LMB-00028", name: "M. IDRIS", dusun: "Lemo Baru", rtRw: "-/-", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1028", lastReading: 122.6, tariffType: "Rumah Tangga", latitude: -3.432773, longitude: 119.37483, billingStatus: "PAID", activeComplaint: null },
  { id: 29, connectionNo: "SR-LMB-00029", name: "MUH. ALI AMIN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1029", lastReading: 147.8, tariffType: "Rumah Tangga", latitude: -3.432943, longitude: 119.374722, billingStatus: "PAID", activeComplaint: null },
  { id: 30, connectionNo: "SR-LMB-00030", name: "SARIPUDDIN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1030", lastReading: 109.3, tariffType: "Rumah Tangga", latitude: -3.432766, longitude: 119.374803, billingStatus: "PAID", activeComplaint: null },
  { id: 31, connectionNo: "SR-LMB-00031", name: "HASANUDDIN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1031", lastReading: 133.5, tariffType: "Rumah Tangga", latitude: -3.432694, longitude: 119.373942, billingStatus: "PAID", activeComplaint: null },
  { id: 32, connectionNo: "SR-LMB-00032", name: "ABDUL WAHAP", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1032", lastReading: 95.0, tariffType: "Rumah Tangga", latitude: -3.43299, longitude: 119.374808, billingStatus: "PAID", activeComplaint: null },
  { id: 33, connectionNo: "SR-LMB-00033", name: "ABDULLAH", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1033", lastReading: 84.1, tariffType: "Rumah Tangga", latitude: -3.433062, longitude: 119.374879, billingStatus: "PAID", activeComplaint: null },
  { id: 34, connectionNo: "SR-LMB-00034", name: "HAMDAN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1034", lastReading: 116.8, tariffType: "Rumah Tangga", latitude: -3.433259, longitude: 119.3747, billingStatus: "PAID", activeComplaint: null },
  { id: 35, connectionNo: "SR-LMB-00035", name: "SABANNUR", dusun: "Lemo Baru", rtRw: "-/-", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1035", lastReading: 73.2, tariffType: "Rumah Tangga", latitude: -3.432795, longitude: 119.37511, billingStatus: "PAID", activeComplaint: null },
  { id: 36, connectionNo: "SR-LMB-00036", name: "RIADHI YUSUF", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1036", lastReading: 128.4, tariffType: "Rumah Tangga", latitude: -3.432919, longitude: 119.375141, billingStatus: "PAID", activeComplaint: null },
  { id: 37, connectionNo: "SR-LMB-00037", name: "ABU BAKAR", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1037", lastReading: 102.1, tariffType: "Rumah Tangga", latitude: -3.433031, longitude: 119.375307, billingStatus: "PAID", activeComplaint: null },
  { id: 38, connectionNo: "SR-LMB-00038", name: "BAHARUDDIN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1038", lastReading: 161.7, tariffType: "Rumah Tangga", latitude: -3.433247, longitude: 119.375382, billingStatus: "PAID", activeComplaint: null },
  { id: 39, connectionNo: "SR-LMB-00039", name: "NURHANUDDIN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1039", lastReading: 119.9, tariffType: "Rumah Tangga", latitude: -3.433064, longitude: 119.375381, billingStatus: "PAID", activeComplaint: null },
  { id: 41, connectionNo: "SR-LMB-00041", name: "RUKIA", dusun: "Lemo Baru", rtRw: "0001000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1041", lastReading: 68.3, tariffType: "Rumah Tangga", latitude: -3.433222, longitude: 119.375611, billingStatus: "PAID", activeComplaint: null },
  { id: 42, connectionNo: "SR-LMB-00042", name: "MAHYUDDIN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1042", lastReading: 140.2, tariffType: "Rumah Tangga", latitude: -3.433285, longitude: 119.375695, billingStatus: "PAID", activeComplaint: null },
  { id: 43, connectionNo: "SR-LMB-00043", name: "ABDUL MAJID", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1043", lastReading: 94.6, tariffType: "Rumah Tangga", latitude: -3.433705, longitude: 119.374607, billingStatus: "PAID", activeComplaint: null },
  { id: 45, connectionNo: "SR-LMB-00045", name: "IDAH", dusun: "Lemo Baru", rtRw: "-/-", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1045", lastReading: 78.5, tariffType: "Rumah Tangga", latitude: -3.433101, longitude: 119.375681, billingStatus: "PAID", activeComplaint: null },
  { id: 46, connectionNo: "SR-LMB-00046", name: "SITTI ARI", dusun: "Lemo Baru", rtRw: "-/-", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1046", lastReading: 115.1, tariffType: "Rumah Tangga", latitude: -3.433043, longitude: 119.375705, billingStatus: "PAID", activeComplaint: null },
  { id: 47, connectionNo: "SR-LMB-00047", name: "SYAHRIL", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1047", lastReading: 132.8, tariffType: "Rumah Tangga", latitude: -3.433354, longitude: 119.375535, billingStatus: "PAID", activeComplaint: null },
  { id: 48, connectionNo: "SR-LMB-00048", name: "BALING", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1048", lastReading: 125.0, tariffType: "Rumah Tangga", latitude: -3.433554, longitude: 119.375747, billingStatus: "PAID", activeComplaint: null },
  { id: 49, connectionNo: "SR-LMB-00049", name: "NASMAN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1049", lastReading: 89.7, tariffType: "Rumah Tangga", latitude: -3.433446, longitude: 119.375927, billingStatus: "PAID", activeComplaint: null },
  { id: 50, connectionNo: "SR-LMB-00050", name: "UMAR MASA, S.Pd.I", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1050", lastReading: 150.3, tariffType: "Rumah Tangga", latitude: -3.433371, longitude: 119.375868, billingStatus: "PAID", activeComplaint: null },
  { id: 51, connectionNo: "SR-LMB-00051", name: "FIRMAN", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1051", lastReading: 107.6, tariffType: "Rumah Tangga", latitude: -3.433167, longitude: 119.375226, billingStatus: "PAID", activeComplaint: null },
  { id: 52, connectionNo: "SR-LMB-00052", name: "HUSRAWATI", dusun: "Lemo Baru", rtRw: "000/000", kpspamsId: 1, kpspamsName: "KPSPAMS Lemo Baru", meterSerial: "MTR-1052", lastReading: 86.9, tariffType: "Rumah Tangga", latitude: -3.433124, longitude: 119.375141, billingStatus: "PAID", activeComplaint: null },
];

const MasterDesaGisMap = dynamic(
  () => import("@/components/gis/MasterDesaGisMap").then((m) => m.MasterDesaGisMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-10 h-10 rounded-full border-3 border-brand-gold-500 border-t-transparent animate-spin" />
        <span className="animate-pulse text-sm font-semibold">
          Memuat Peta Satelit Master GIS Sebaran Air Bersih Desa Kuajang...
        </span>
      </div>
    ),
  }
);

export default function PetaGisPage() {
  const { user, isDesaLevel, activeKpspamsId } = useAuth();
  const [customers, setCustomers] = useState<MasterGisCustomer[]>(BASELINE_CUSTOMERS);
  const [reservoirs, setReservoirs] = useState<ReservoirSourceItem[]>(VILLAGE_RESERVOIRS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Ambil Data Terkini dari API Backend (Pelanggan, Tagihan, dan Pengaduan Gangguan)
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

      // 3. Ambil data sambungan & koordinat pelanggan
      const custRes = await apiClient("/customers?per_page=100");
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

          // Cek fallback koordinat jika kosong
          const baselineMatch = BASELINE_CUSTOMERS.find((b) => b.id === c.id || b.name === c.full_name);
          const finalLat =
            rawLat && rawLat !== 0 && rawLat > -3.45 ? rawLat : baselineMatch?.latitude || -3.4326;
          const finalLng =
            rawLng && rawLng !== 0 && rawLng > 119.35 ? rawLng : baselineMatch?.longitude || 119.3752;

          const connNo =
            primaryConn?.connection_no ||
            primaryConn?.connection_number ||
            c.connection_no ||
            baselineMatch?.connectionNo ||
            `SR-${c.id}`;

          const isUnpaid =
            unpaidMap[c.id] !== undefined ||
            c.billing_status === "UNPAID";

          const activeComp =
            complaintsMap[c.id] || complaintsByConnNo[connNo] || null;

          return {
            id: c.id,
            connectionNo: connNo,
            name: c.full_name || c.name || baselineMatch?.name || "Warga",
            nik: c.nik,
            phone: c.phone || baselineMatch?.phone,
            dusun: c.dusun || primaryConn?.dusun?.name || baselineMatch?.dusun || "Lemo Baru",
            rtRw: c.rt_rw || baselineMatch?.rtRw || "-",
            kpspamsId: Number(c.kpspams_id || 1),
            kpspamsName:
              c.kpspams_name ||
              c.kpspams?.name ||
              (Number(c.kpspams_id) === 1 ? "KPSPAMS Lemo Baru" : `KPSPAMS Unit ${c.kpspams_id}`),
            meterSerial:
              c.meter_serial || primaryConn?.meter?.serial_number || baselineMatch?.meterSerial || `MTR-${c.id}`,
            lastReading: Number(c.last_reading ?? primaryConn?.meter?.current_reading ?? baselineMatch?.lastReading ?? 100),
            tariffType: c.customer_type?.name || "Rumah Tangga",
            latitude: finalLat,
            longitude: finalLng,
            billingStatus: isUnpaid ? "UNPAID" : "PAID",
            unpaidAmount: isUnpaid ? unpaidMap[c.id] || 10000 : 0,
            activeComplaint: activeComp,
          };
        });

        // Pastikan tidak ada data yang hilang: jika ada baseline yang belum di-fetch, gabungkan
        const merged = [...liveCustomers];
        BASELINE_CUSTOMERS.forEach((bc) => {
          if (!merged.some((m) => m.id === bc.id || m.connectionNo === bc.connectionNo)) {
            merged.push(bc);
          }
        });

        setCustomers(merged);
      }
    } catch (err) {
      console.warn("Gagal fetch data GIS lengkap, menggunakan baseline terverifikasi:", err);
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
                <span>Peta Master GIS Sebaran Jaringan Air Bersih</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Pemantauan spasial menyeluruh seluruh 37+ titik sambungan rumah warga Desa Kuajang,
                status pelunasan iuran, titik pengaduan pipa bocor, serta jaringan pipa transmisi dari
                hulu mata air pegunungan ke bak penampungan dan reservoir desa.
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
                href="/dashboard/pengaduan"
                className="flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-amber-600/90 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-200" />
                <span>Daftar Pengaduan SPK</span>
              </Link>

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
          reservoirs={reservoirs}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={(cust) => setSelectedCustomerId(cust.id)}
        />
      </div>
    </DashboardLayout>
  );
}
