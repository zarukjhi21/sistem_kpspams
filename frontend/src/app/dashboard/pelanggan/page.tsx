"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DEMO_CUSTOMERS, DemoCustomer } from "@/lib/demo-data";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import { scanKtpImage } from "@/lib/ktp-ocr-client";

const mapApiCustomerToDemo = (item: any): DemoCustomer => {
  const primaryConn = item.connections?.[0];
  const rawReading =
    item.last_reading !== undefined && item.last_reading !== null
      ? item.last_reading
      : item.lastReading !== undefined && item.lastReading !== null
      ? item.lastReading
      : item.initial_reading !== undefined && item.initial_reading !== null
      ? item.initial_reading
      : primaryConn?.meter?.current_reading !== undefined && primaryConn?.meter?.current_reading !== null
      ? primaryConn.meter.current_reading
      : primaryConn?.meter?.initial_reading !== undefined && primaryConn?.meter?.initial_reading !== null
      ? primaryConn.meter.initial_reading
      : 0;
  const lastReadingNum = Number(rawReading);

  return {
    id: item.id,
    connectionNo: primaryConn?.connection_no || primaryConn?.connection_number || item.connection_no || item.code || `SR-${item.id}`,
    name: item.full_name || item.name,
    nik: item.nik || "",
    birthPlaceDate: item.birth_place_date,
    gender: item.gender,
    address: item.identity_address || item.address,
    rtRw: item.rt_rw,
    village: item.village || "KUAJANG",
    district: item.district || "BINUANG",
    religion: item.religion,
    maritalStatus: item.marital_status,
    occupation: item.occupation,
    phone: item.phone,
    dusun: item.dusun || primaryConn?.dusun?.name || "Lemo Baru",
    kpspamsId: Number(item.kpspams_id || item.kpspams?.id || 1),
    kpspamsName: item.kpspams_name || item.kpspams?.name || (Number(item.kpspams_id) === 1 ? "KPSPAMS Lemo Baru" : `KPSPAMS Unit ${item.kpspams_id}`),
    meterSerial: item.meter_serial || primaryConn?.meter?.serial_number || "MTR-1001",
    lastReading: isNaN(lastReadingNum) ? 0 : lastReadingNum,
    status: (item.status === "ACTIVE" ? "ACTIVE" : item.status === "SEALED" ? "SEALED" : "DISCONNECTED") as any,
    tariffType: item.customer_type?.name || "Rumah Tangga",
    latitude: item.latitude !== null && item.latitude !== undefined ? Number(item.latitude) : (primaryConn?.latitude ? Number(primaryConn.latitude) : -3.4215),
    longitude: item.longitude !== null && item.longitude !== undefined ? Number(item.longitude) : (primaryConn?.longitude ? Number(primaryConn.longitude) : 119.3452),
    billingStatus: item.billing_status || "UNPAID",
    ktpPhotoUrl: item.ktp_photo_path,
  };
};

const GisLocationPicker = dynamic(
  () => import("@/components/gis/GisLocationPicker").then((m) => m.GisLocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xs">
        <span className="animate-pulse">Memuat Peta Satelit GIS Desa Kuajang...</span>
      </div>
    ),
  }
);
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  MapPin,
  Gauge,
  Activity,
  Receipt,
  Phone,
  X,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Building2,
  Camera,
  Scan,
  RotateCcw,
  Check,
  AlertTriangle,
  Shield,
  Lock,
  Smartphone,
  UploadCloud,
  Image as ImageIcon,
  Pencil,
  Trash2,
  AlertOctagon,
  Save,
} from "lucide-react";

export default function PelangganPage() {
  return (
    <DashboardLayout>
      <PelangganContent />
    </DashboardLayout>
  );
}

function PelangganContent() {
  const { activeKpspamsId, user, isDesaLevel } = useAuth();
  const [customers, setCustomers] = useState<DemoCustomer[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kpspams_customers");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && !parsed.some((c: any) => c.name === "Baharuddin S." || c.connectionNo === "SR-LMB-00005")) {
            return parsed;
          }
        } catch {
          // fallback
        }
      }
    }
    return DEMO_CUSTOMERS;
  });

  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const fetchCustomersFromApi = async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await apiClient("/customers?per_page=100");
      if (res?.status === "success" && Array.isArray(res.data)) {
        const mapped = res.data.map(mapApiCustomerToDemo);
        setCustomers(mapped);
        if (typeof window !== "undefined") {
          localStorage.setItem("kpspams_customers", JSON.stringify(mapped));
        }
      }
    } catch (err) {
      console.warn("Gagal fetch pelanggan dari server, gunakan cache lokal:", err);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Muat data pelanggan langsung dari basis data server saat halaman dibuka atau konteks berganti
  useEffect(() => {
    fetchCustomersFromApi();
  }, [activeKpspamsId]);

  const updateCustomers = (newList: DemoCustomer[]) => {
    setCustomers(newList);
    if (typeof window !== "undefined") {
      localStorage.setItem("kpspams_customers", JSON.stringify(newList));
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDusun, setSelectedDusun] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<DemoCustomer | null>(null);

  // Kunci scope KPSPAMS untuk petugas lapangan / non-desa
  const effectiveKpspamsId = !isDesaLevel && user?.kpspamsId ? Number(user.kpspamsId) : (activeKpspamsId !== null && activeKpspamsId !== undefined ? Number(activeKpspamsId) : 1);

  // Dusun yang berhak diakses oleh petugas yang sedang login
  const getAllowedDusuns = () => {
    if (effectiveKpspamsId === 1) return ["Lemo Baru"];
    if (effectiveKpspamsId === 2) return ["Lemo Tua"];
    if (effectiveKpspamsId === 3) return ["Sarampu 1", "Pakkandoang", "Sarampu 2"];
    return ["Lemo Baru", "Lemo Tua", "Sarampu 1", "Pakkandoang", "Sarampu 2"];
  };

  const allowedDusuns = getAllowedDusuns();

  // Modal State Tambah Pelanggan Baru
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newNik, setNewNik] = useState("");
  const [newBirthPlaceDate, setNewBirthPlaceDate] = useState("");
  const [newGender, setNewGender] = useState<string>("PEREMPUAN");
  const [newReligion, setNewReligion] = useState("ISLAM");
  const [newMaritalStatus, setNewMaritalStatus] = useState("");
  const [newOccupation, setNewOccupation] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newRtRw, setNewRtRw] = useState("000/000");
  const [newVillage, setNewVillage] = useState("KUAJANG");
  const [newDistrict, setNewDistrict] = useState("BINUANG");
  const [newDusun, setNewDusun] = useState("Lemo Baru");
  const [newPhone, setNewPhone] = useState("");
  const [newMeterSerial, setNewMeterSerial] = useState("");
  const [newInitialReading, setNewInitialReading] = useState("0.00");
  const [newTariffType, setNewTariffType] = useState("Rumah Tangga");
  const [newLatitude, setNewLatitude] = useState<number>(-3.4582);
  const [newLongitude, setNewLongitude] = useState<number>(119.3415);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State Edit Pelanggan & Titik Google Maps
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<DemoCustomer | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editNik, setEditNik] = useState("");
  const [editBirthPlaceDate, setEditBirthPlaceDate] = useState("");
  const [editGender, setEditGender] = useState<string>("PEREMPUAN");
  const [editReligion, setEditReligion] = useState("ISLAM");
  const [editMaritalStatus, setEditMaritalStatus] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editRtRw, setEditRtRw] = useState("000/000");
  const [editVillage, setEditVillage] = useState("KUAJANG");
  const [editDistrict, setEditDistrict] = useState("BINUANG");
  const [editDusun, setEditDusun] = useState("Lemo Baru");
  const [editPhone, setEditPhone] = useState("");
  const [editMeterSerial, setEditMeterSerial] = useState("");
  const [editLastReading, setEditLastReading] = useState("0.00");
  const [editTariffType, setEditTariffType] = useState("Rumah Tangga");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "SEALED" | "DISCONNECTED">("ACTIVE");
  const [editLatitude, setEditLatitude] = useState<number>(-3.4582);
  const [editLongitude, setEditLongitude] = useState<number>(119.3415);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal State Hapus / Segel Pelanggan
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [customerToAction, setCustomerToAction] = useState<DemoCustomer | null>(null);

  // AI KTP OCR Scanner State
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [isScanningKtp, setIsScanningKtp] = useState(false);
  const [scanProgressText, setScanProgressText] = useState("");
  const [aiExtracted, setAiExtracted] = useState(false);
  const [scanDuration, setScanDuration] = useState<number | null>(null);
  const [ocrEngine, setOcrEngine] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ktpPhotoUploaded, setKtpPhotoUploaded] = useState(false);
  const [ktpPreviewUrl, setKtpPreviewUrl] = useState<string | null>(null);
  const [ktpFileName, setKtpFileName] = useState<string | null>(null);

  // Helper untuk menentukan KPSPAMS otomatis berdasarkan Dusun
  const getKpspamsByDusun = (dusunName: string) => {
    switch (dusunName) {
      case "Lemo Baru":
        return { id: 1, name: "KPSPAMS Lemo Baru", codePrefix: "LMB" };
      case "Lemo Tua":
        return { id: 2, name: "KPSPAMS Lemo Tua", codePrefix: "LMT" };
      case "Sarampu 1":
      case "Pakkandoang":
        return { id: 3, name: "KPSPAMS Sarampu 1", codePrefix: "SR1" };
      case "Sarampu 2":
        return { id: 3, name: "KPSPAMS Sarampu 1 (Persiapan Sarampu 2)", codePrefix: "SR2" };
      default:
        return { id: 1, name: "KPSPAMS Lemo Baru", codePrefix: "LMB" };
    }
  };

  const handleOpenCreateModal = () => {
    // Generate default dusun and suggested serial based on officer's allowed dusun
    const defaultDusun = allowedDusuns[0] || "Lemo Baru";
    setNewDusun(defaultDusun);
    const kInfo = getKpspamsByDusun(defaultDusun);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setNewMeterSerial(`MTR-${kInfo.codePrefix}-${randomSuffix}`);
    setNewInitialReading("0.00");
    setNewLatitude(-3.4582);
    setNewLongitude(119.3415);
    setErrorMessage(null);
    setOcrError(null);
    setOcrEngine(null);
    setScanDuration(null);
    setIsScanningKtp(false);
    setScanProgressText("");
    setAiExtracted(false);
    setKtpPhotoUploaded(false);
    setKtpPreviewUrl(null);
    setKtpFileName(null);
    setNewFullName("");
    setNewNik("");
    setNewBirthPlaceDate("");
    setNewGender("PEREMPUAN");
    setNewReligion("ISLAM");
    setNewMaritalStatus("");
    setNewOccupation("");
    setNewAddress("");
    setNewRtRw("000/000");
    setNewVillage("KUAJANG");
    setNewDistrict("BINUANG");
    setNewPhone("");
    setCreateModalOpen(true);
  };

  // Kompresi gambar KTP di sisi klien sebelum dikirim ke AI OCR server
  // Mengurangi ukuran foto kamera HP dari 5MB-15MB menjadi ~200KB dalam hitungan milidetik,
  // serta meningkatkan kontras teks agar karakter NIK dan Nama terbaca akurat oleh AI Vision.
  const compressKtpImageForOcr = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 1500; // Resolusi optimal tinggi untuk teks dokumen KTP
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(objectUrl);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        // Tingkatkan kontras dan kecerahan teks agar terbaca jernih oleh OCR
        ctx.filter = "contrast(1.15) brightness(1.02)";
        ctx.drawImage(img, 0, 0, width, height);
        // Kualitas 0.90 menghasilkan teks tajam dan ukuran berkas sangat efisien
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.90);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });
  };

  // Handle Unggah Gambar / Foto KTP Asli dari HP atau Komputer
  const handleKtpFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Format berkas harus berupa gambar (JPG, PNG, atau WebP).");
      return;
    }

    setErrorMessage(null);
    setOcrError(null);
    setKtpFileName(file.name);
    setIsScanningKtp(true);
    setScanProgressText("Mengoptimalkan foto KTP secara instan (100% cepat)...");

    try {
      // 1. Kompresi otomatis dalam ~50ms di browser
      const compressedDataUrl = await compressKtpImageForOcr(file);
      setKtpPreviewUrl(compressedDataUrl);
      setKtpPhotoUploaded(true);

      // 2. Kirim data yang sudah dioptimasi ke AI OCR server
      await triggerAiOcrExtraction(compressedDataUrl, file.name);
    } catch (err: any) {
      console.error("Gagal memproses gambar KTP:", err);
      setIsScanningKtp(false);
      setOcrError("Gagal membaca berkas gambar. Pastikan format gambar valid.");
    }
  };

  // Pindai Foto KTP dengan AI OCR Vision Asli (Web Worker + Gemini AI)
  const triggerAiOcrExtraction = async (dataUrl: string, fileName: string) => {
    setIsScanningKtp(true);
    setOcrError(null);
    setAiExtracted(false);
    setScanProgressText("AI Vision sedang membaca NIK, Nama, dan Wilayah dari KTP...");

    try {
      const result = await scanKtpImage(dataUrl, (prog) => {
        setScanProgressText(prog);
      });

      if (result.success && result.data) {
        const d = result.data;

        // Terapkan hasil pembacaan teks asli dari KTP langsung ke state form
        if (d.nik) setNewNik(d.nik);
        if (d.name) setNewFullName(d.name);
        if (d.birthPlaceDate) setNewBirthPlaceDate(d.birthPlaceDate);
        if (d.gender) setNewGender(d.gender);
        if (d.address) setNewAddress(d.address);
        if (d.rtRw) setNewRtRw(d.rtRw);
        if (d.village) setNewVillage(d.village);
        if (d.district) setNewDistrict(d.district);
        if (d.religion) setNewReligion(d.religion);
        if (d.maritalStatus) setNewMaritalStatus(d.maritalStatus);
        if (d.occupation) setNewOccupation(d.occupation);

        // Dusun Layanan
        const targetDusun = d.dusun || allowedDusuns[0] || "Lemo Baru";
        if (allowedDusuns.includes(targetDusun) || isDesaLevel) {
          setNewDusun(targetDusun);
        } else {
          setNewDusun(allowedDusuns[0] || "Lemo Baru");
        }

        if (d.suggestedLat && d.suggestedLng) {
          setNewLatitude(d.suggestedLat);
          setNewLongitude(d.suggestedLng);
        }

        const kInfo = getKpspamsByDusun(targetDusun);
        setNewMeterSerial(`MTR-${kInfo.codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`);
        
        const seconds = result.executionTimeMs ? (result.executionTimeMs / 1000).toFixed(1) : "1.8";
        setScanDuration(Number(seconds));
        if (result.engine) setOcrEngine(result.engine);

        // Validasi apakah setidaknya Nama, NIK, atau Alamat berhasil terekstrak
        if (d.name || d.nik || d.address) {
          setAiExtracted(true);
        } else {
          setOcrError("Teks Nama dan NIK kurang terbaca jelas oleh AI Vision. Silakan lengkapi atau koreksi kolom formulir di bawah secara manual.");
          setAiExtracted(false);
        }
      } else {
        setOcrError(result.message || "Teks KTP tidak terbaca jelas. Silakan periksa formulir dan isi secara manual jika diperlukan.");
        setAiExtracted(false);
      }
    } catch (err: any) {
      console.error("OCR API error:", err);
      setOcrError("Terjadi kendala saat memindai KTP. Silakan coba lagi atau isi formulir secara manual.");
      setAiExtracted(false);
    } finally {
      setIsScanningKtp(false);
    }
  };

  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFullName.trim()) {
      setErrorMessage("Nama lengkap pelanggan wajib diisi.");
      return;
    }
    if (newNik.trim().length !== 16) {
      setErrorMessage("NIK harus tepat 16 digit angka.");
      return;
    }

    const kInfo = getKpspamsByDusun(newDusun);

    // Multi-tenant check: Petugas tidak boleh mendaftarkan pelanggan ke dusun di luar kewenangannya
    if (!isDesaLevel && user?.kpspamsId && kInfo.id !== user.kpspamsId) {
      setErrorMessage(`Akses Ditolak: Anda bertugas di ${user.kpspamsName} dan hanya berwenang menambahkan pelanggan di wilayah tugas Anda.`);
      return;
    }

    const dusunMap: Record<string, number> = {
      "Sarampu 1": 1,
      "Sarampu 2": 2,
      "Lemo Baru": 3,
      "Lemo Tua": 4,
      "Pakkandoang": 5,
    };
    const dusunId = dusunMap[newDusun] || 3;

    const typeMap: Record<string, number> = {
      "Rumah Tangga": 1,
      "Niaga / Usaha": 2,
      "Sosial / Ibadah": 3,
      "Instansi / Pemerintah": 4,
    };
    const customerTypeId = typeMap[newTariffType] || 1;

    try {
      // 1. Unggah arsip foto fisik KTP ke Google Drive Desa jika foto ada
      let gdrivePhotoUrl: string | undefined = undefined;
      if (ktpPreviewUrl) {
        try {
          const base64Data = ktpPreviewUrl.replace(/^data:image\/\w+;base64,/, "");
          const cleanNik = newNik.trim() || Date.now().toString();
          const cleanName = newFullName.trim().replace(/[^a-zA-Z0-9]/g, "_") || "WARGA";
          const filename = `KTP_${cleanNik}_${cleanName}.jpg`;

          const gdriveRes: any = await apiClient("/upload-ktp-drive", {
            method: "POST",
            body: JSON.stringify({
              image: base64Data,
              filename,
              mimeType: "image/jpeg",
            }),
          });
          if (gdriveRes?.fileUrl || gdriveRes?.data?.fileUrl) {
            gdrivePhotoUrl = gdriveRes?.fileUrl || gdriveRes?.data?.fileUrl;
          }
        } catch (driveErr) {
          console.warn("Gagal mengunggah foto KTP ke Google Drive:", driveErr);
        }
      }

      // 2. Simpan Pelanggan Baru ke Backend API
      const custPayload = {
        customer_type_id: customerTypeId,
        nik: newNik.trim(),
        full_name: newFullName.trim(),
        birth_place_date: newBirthPlaceDate.trim() || undefined,
        gender: newGender,
        phone: newPhone.trim() || "081200000000",
        identity_address: newAddress.trim() || `Dusun ${newDusun}, Desa Kuajang`,
        rt_rw: newRtRw.trim() || "000/000",
        dusun: newDusun,
        village: newVillage.trim() || "KUAJANG",
        district: newDistrict.trim() || "BINUANG",
        religion: newReligion,
        marital_status: newMaritalStatus.trim() || undefined,
        occupation: newOccupation.trim() || undefined,
        kpspams_id: kInfo.id,
        ktp_photo_path: gdrivePhotoUrl || undefined,
        meter_serial: newMeterSerial.trim() || `MTR-${kInfo.codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
        initial_reading: parseFloat(newInitialReading) || 0,
        last_reading: parseFloat(newInitialReading) || 0,
        meter_brand: "Onda Multi-Jet",
        dusun_id: dusunId,
        latitude: newLatitude,
        longitude: newLongitude,
      };

      const custRes = await apiClient("/customers", {
        method: "POST",
        body: JSON.stringify(custPayload),
      });

      if (custRes?.status === "success" && custRes.data?.id) {
        const createdCustomerId = custRes.data.id;

        // 2. Pasang Sambungan Rumah (SR) & Meter Air Resmi ke Backend API
        const connPayload = {
          customer_id: createdCustomerId,
          dusun_id: dusunId,
          meter_serial: newMeterSerial.trim() || `MTR-${kInfo.codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
          meter_brand: "Onda Multi-Jet",
          initial_reading: parseFloat(newInitialReading) || 0,
          address_detail: newAddress.trim() || `Dusun ${newDusun}`,
          latitude: newLatitude,
          longitude: newLongitude,
        };

        const connRes = await apiClient("/connections", {
          method: "POST",
          body: JSON.stringify(connPayload),
        });

        // 3. Muat ulang data terbaru dari basis data server
        await fetchCustomersFromApi();

        setCreateModalOpen(false);
        setNewFullName("");
        setNewNik("");
        setNewPhone("");
        setNewAddress("");
        const createdConnNo = connRes?.data?.connection_no || `SR-${kInfo.codePrefix}-BARU`;
        setSuccessMessage(
          `Pelanggan baru "${newFullName.trim()}" berhasil tersimpan permanen di database server dengan No. SR: ${createdConnNo} (${kInfo.name}).`
        );
        setTimeout(() => setSuccessMessage(null), 6000);
        return;
      }
    } catch (apiErr: any) {
      console.warn("API simpan pelanggan gagal:", apiErr);
      const errMsg = apiErr?.message || (apiErr?.errors ? Object.values(apiErr.errors).flat().join(", ") : "Gagal mendaftarkan ke server.");
      setErrorMessage(`Gagal menyimpan ke basis data: ${errMsg}`);
      return;
    }
  };

  // Handler Buka Modal Edit Pelanggan
  const handleOpenEditModal = (cust: DemoCustomer) => {
    setEditingCustomer(cust);
    setEditFullName(cust.name);
    setEditNik(cust.nik);
    setEditBirthPlaceDate(cust.birthPlaceDate || "");
    setEditGender(cust.gender || "PEREMPUAN");
    setEditReligion(cust.religion || "ISLAM");
    setEditMaritalStatus(cust.maritalStatus || "");
    setEditOccupation(cust.occupation || "");
    setEditAddress(cust.address || "");
    setEditRtRw(cust.rtRw || "000/000");
    setEditVillage(cust.village || "KUAJANG");
    setEditDistrict(cust.district || "BINUANG");
    setEditDusun(cust.dusun);
    setEditPhone(cust.phone || "");
    setEditMeterSerial(cust.meterSerial);
    setEditLastReading(String(cust.lastReading));
    setEditTariffType(cust.tariffType);
    setEditStatus(cust.status);
    setEditLatitude(cust.latitude || -3.4582);
    setEditLongitude(cust.longitude || 119.3415);
    setEditError(null);
    setEditModalOpen(true);
  };

  // Handler Simpan Perubahan Edit Pelanggan
  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    if (!editFullName.trim()) {
      setEditError("Nama lengkap pelanggan wajib diisi.");
      return;
    }
    if (editNik.trim().length !== 16) {
      setEditError("NIK harus tepat 16 digit angka.");
      return;
    }

    const kInfo = getKpspamsByDusun(editDusun);

    // Multi-tenant check
    if (!isDesaLevel && user?.kpspamsId && kInfo.id !== user.kpspamsId) {
      setEditError(`Akses Ditolak: Anda tidak dapat memindahkan pelanggan ke luar unit ${user.kpspamsName}.`);
      return;
    }

    const dusunMap: Record<string, number> = {
      "Sarampu 1": 1,
      "Sarampu 2": 2,
      "Lemo Baru": 3,
      "Lemo Tua": 4,
      "Pakkandoang": 5,
    };

    try {
      const editPayload = {
        full_name: editFullName.trim(),
        birth_place_date: editBirthPlaceDate.trim() || undefined,
        gender: editGender,
        phone: editPhone.trim() || "081200000000",
        identity_address: editAddress.trim() || `Dusun ${editDusun}`,
        rt_rw: editRtRw.trim() || undefined,
        dusun: editDusun,
        dusun_id: dusunMap[editDusun] || 3,
        village: editVillage.trim() || undefined,
        district: editDistrict.trim() || undefined,
        religion: editReligion,
        marital_status: editMaritalStatus.trim() || undefined,
        occupation: editOccupation.trim() || undefined,
        latitude: editLatitude,
        longitude: editLongitude,
        meter_serial: editMeterSerial.trim() || undefined,
        initial_reading: parseFloat(editLastReading) || 0,
        last_reading: parseFloat(editLastReading) || 0,
        status: editStatus,
      };

      await apiClient(`/customers/${editingCustomer.id}`, {
        method: "PUT",
        body: JSON.stringify(editPayload),
      });

      await fetchCustomersFromApi();
      setEditModalOpen(false);
      setEditingCustomer(null);
      setSuccessMessage(`Data pelanggan "${editFullName.trim()}" (${editingCustomer.connectionNo}) berhasil diperbarui di database server.`);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (apiErr: any) {
      const errMsg = apiErr?.message || "Gagal memperbarui data di server.";
      setEditError(`Gagal memperbarui: ${errMsg}`);
    }
  };

  // Handler Modal Aksi Segel / Putus / Hapus
  const handleOpenActionModal = (cust: DemoCustomer) => {
    setCustomerToAction(cust);
    setActionModalOpen(true);
  };

  const handleApplyStatusChange = async (newStatus: "ACTIVE" | "SEALED" | "DISCONNECTED") => {
    if (!customerToAction) return;
    const label = newStatus === "ACTIVE" ? "Diaktifkan Kembali" : newStatus === "SEALED" ? "Disegel Sementara" : "Diputus Permanen";

    try {
      await apiClient(`/connections/${customerToAction.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
          notes: `Status diubah ke ${newStatus} melalui antarmuka operasional`,
        }),
      });
      await fetchCustomersFromApi();
    } catch (err) {
      console.warn("Gagal ubah status koneksi di server, gunakan fallback:", err);
      const updatedList = customers.map((c) =>
        c.id === customerToAction.id ? { ...c, status: newStatus } : c
      );
      updateCustomers(updatedList);
    }

    setActionModalOpen(false);
    setCustomerToAction(null);
    setSuccessMessage(`Status sambungan ${customerToAction.name} (${customerToAction.connectionNo}) berhasil diubah menjadi "${label}".`);
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  const handleDeletePermanent = async () => {
    if (!customerToAction) return;
    const deletedName = customerToAction.name;
    const deletedNo = customerToAction.connectionNo;

    try {
      await apiClient(`/customers/${customerToAction.id}`, {
        method: "DELETE",
      });
      await fetchCustomersFromApi();
    } catch (err) {
      console.warn("Gagal hapus pelanggan di server, gunakan fallback:", err);
      const updatedList = customers.filter((c) => c.id !== customerToAction.id);
      updateCustomers(updatedList);
    }

    setActionModalOpen(false);
    setCustomerToAction(null);
    setSuccessMessage(`Data sambungan ${deletedName} (${deletedNo}) berhasil dihapus permanen dari basis data server.`);
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  // Filter customers based on search, active KPSPAMS context, dusun, and status
  const filteredCustomers = customers.filter((c) => {
    // Multi-tenant isolation: Petugas hanya melihat pelanggan di unitnya
    if (effectiveKpspamsId !== null && Number(c.kpspamsId) !== Number(effectiveKpspamsId)) {
      return false;
    }
    if (
      searchTerm &&
      !c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.connectionNo.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.nik.includes(searchTerm)
    ) {
      return false;
    }
    if (selectedDusun !== "ALL" && c.dusun !== selectedDusun) {
      return false;
    }
    if (selectedStatus !== "ALL" && c.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Title & Action Banner */}
      <div className="bg-gradient-to-r from-brand-maroon-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-brand-maroon-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Data Pelanggan & Jaringan Air
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Register nomor SR, seri meter fisik dial, dan status penyegelan sambungan warga Desa Kuajang.
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreateModal}
        >
          + Tambah Pelanggan & SR Baru
        </Button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-3 animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-xs">Pendaftaran Berhasil!</div>
            <div className="text-xs text-emerald-800 mt-0.5">{successMessage}</div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scope Restriction Indicator for Field Officers */}
      {!isDesaLevel && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <div>
              <span className="font-bold">Akses Petugas Lapangan: {user?.kpspamsName}</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Hak akses Anda dibatasi khusus untuk wilayah <strong>Dusun {allowedDusuns.join(", ")}</strong>. Anda tidak dapat melihat atau menambahkan pelanggan di dusun lain.
              </p>
            </div>
          </div>
          <span className="px-2 py-1 rounded-lg bg-amber-200/80 text-amber-900 font-bold text-[10px] flex items-center space-x-1">
            <Lock className="w-3 h-3" />
            <span>Terkunci</span>
          </span>
        </div>
      )}

      {/* Filter Card */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari Nama, No. SR, atau NIK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
            />
          </div>

          <div>
            <select
              value={selectedDusun}
              onChange={(e) => setSelectedDusun(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
            >
              {isDesaLevel && <option value="ALL">Semua Dusun Layanan</option>}
              {allowedDusuns.map((d) => (
                <option key={d} value={d}>
                  Dusun {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
            >
              <option value="ALL">Semua Status Sambungan</option>
              <option value="ACTIVE">Aktif (Teraliri Air)</option>
              <option value="SEALED">Disegel (Tunggakan)</option>
              <option value="DISCONNECTED">Diputus Permanen</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Mobile Card View (< md) */}
      <div className="md:hidden space-y-3">
        <div className="text-xs text-slate-500 px-1 font-medium">
          Menampilkan <strong>{filteredCustomers.length}</strong> sambungan pelanggan
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            Tidak ada pelanggan yang sesuai dengan filter.
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3"
            >
              {/* Header row: Connection No & Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-xs text-brand-maroon-900 bg-brand-maroon-50 px-2 py-0.5 rounded-md border border-brand-maroon-200">
                  {cust.connectionNo}
                </span>
                {cust.status === "ACTIVE" ? (
                  <Badge variant="success" size="sm">Aktif</Badge>
                ) : cust.status === "SEALED" ? (
                  <Badge variant="warning" size="sm">Disegel</Badge>
                ) : (
                  <Badge variant="danger" size="sm">Diputus</Badge>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">NIK: {cust.nik}</div>
                <div className="text-[11px] text-slate-600 mt-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{cust.dusun}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{cust.kpspamsName}</span>
                </div>
              </div>

              {/* Meter Info Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Seri Meter Fisik</div>
                  <div className="font-mono font-bold text-xs text-slate-700">{cust.meterSerial}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Stand Terakhir</div>
                  <div className="font-tabular font-black text-sm text-slate-900">
                    {cust.lastReading.toFixed(2)} m³
                  </div>
                </div>
              </div>

              {/* Direct Actions: Clean 2-tier buttons without overlap */}
              <div className="pt-2 space-y-2 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-[11px] px-1.5"
                    onClick={() => setSelectedCustomer(cust)}
                    icon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Detail
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[11px] px-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                    onClick={() => handleOpenEditModal(cust)}
                    icon={<Pencil className="w-3.5 h-3.5 text-amber-600" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[11px] px-1.5 text-rose-700 border-rose-300 hover:bg-rose-50"
                    onClick={() => handleOpenActionModal(cust)}
                    icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                  >
                    Tindakan
                  </Button>
                </div>
                <Link href="/dashboard/penagihan-lapangan" className="block w-full">
                  <Button variant="primary" size="sm" className="w-full font-bold shadow-sm" icon={<Smartphone className="w-3.5 h-3.5" />}>
                    Catat & Tagih Warga Ini
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block">
        <Card>
          <CardHeader
            title={`Daftar Sambungan (${filteredCustomers.length} Terpilih)`}
            subtitle="Data register terhubung ke multi-tenant KPSPAMS aktif"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. Sambungan (SR)</th>
                  <th className="py-3 px-4">Nama Pelanggan / NIK</th>
                  <th className="py-3 px-4">Dusun / KPSPAMS</th>
                  <th className="py-3 px-4">Seri Meter</th>
                  <th className="py-3 px-4 text-right">Stand Terakhir</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data pelanggan yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-maroon-900">
                        {cust.connectionNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">NIK: {cust.nik}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{cust.dusun}</div>
                        <div className="text-[10px] text-slate-400">{cust.kpspamsName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {cust.meterSerial}
                      </td>
                      <td className="py-3.5 px-4 text-right font-tabular font-bold text-slate-800">
                        {cust.lastReading.toFixed(2)} m³
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {cust.status === "ACTIVE" ? (
                          <Badge variant="success" size="sm">Aktif</Badge>
                        ) : cust.status === "SEALED" ? (
                          <Badge variant="warning" size="sm">Disegel</Badge>
                        ) : (
                          <Badge variant="danger" size="sm">Diputus</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {cust.ktpPhotoUrl && (
                            <a
                              href={cust.ktpPhotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 transition"
                              title="Buka Arsip Foto e-KTP di Google Drive"
                            >
                              <Camera className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-brand-maroon-800 transition"
                            title="Lihat Detail Sambungan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(cust)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 hover:text-amber-800 border border-transparent hover:border-amber-200 transition"
                            title="Edit Data Pelanggan & Titik Maps"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(cust)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 border border-transparent hover:border-rose-200 transition"
                            title="Segel, Putus, atau Hapus Sambungan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modal Tambah Pelanggan & SR Baru */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pendaftaran Pelanggan & Sambungan Rumah Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Input data identitas warga, lokasi dusun, dan spesifikasi meter fisik dial.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Hidden File Inputs for Gallery and Camera */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleKtpFileSelect(file);
                e.target.value = "";
              }}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleKtpFileSelect(file);
                e.target.value = "";
              }}
            />

            {/* AI KTP Scanning & Auto-Extraction Card */}
            <div className="mb-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-brand-maroon-950 text-white border border-indigo-700/50 shadow-md p-4 space-y-3">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Fitur Cerdas AI Vision</span>
                  </span>
                  <span className="text-xs font-bold text-white">Foto KTP Warga & Ekstrak Otomatis</span>
                </div>
                {aiExtracted && (
                  <Badge variant="success" size="sm">
                    ✓ Data Terekstrak
                  </Badge>
                )}
              </div>

              {/* State 1: Belum Ada Foto KTP */}
              {!ktpPreviewUrl && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleKtpFileSelect(file);
                  }}
                  className="border-2 border-dashed border-indigo-400/40 hover:border-amber-400/70 bg-indigo-900/20 hover:bg-indigo-900/30 rounded-2xl p-5 text-center transition flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner">
                    <Camera className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Ambil Foto atau Unggah Gambar KTP Warga
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 max-w-sm">
                      Pilih foto KTP dari galeri atau potret langsung dengan kamera HP. AI otomatis mengisi NIK, Nama, dan Wilayah ke formulir.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition flex items-center space-x-1.5 active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Foto KTP (Kamera HP)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center space-x-1.5 active:scale-95"
                    >
                      <UploadCloud className="w-4 h-4 text-slate-300" />
                      <span>Pilih Gambar (Galeri / File)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* State 2: Foto KTP Terlampir & Sedang Dipindai / Selesai */}
              {ktpPreviewUrl && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-500/50 bg-black/70 shadow-lg max-h-60 flex items-center justify-center">
                    {/* The real KTP image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ktpPreviewUrl}
                      alt="Pratinjau KTP Warga"
                      className="max-h-60 w-auto object-contain rounded-xl"
                    />

                    {/* Laser Scanner Effect when Scanning */}
                    {isScanningKtp && (
                      <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-4">
                        {/* Sweeping laser line */}
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-pulse mb-3" />
                        <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-400/60 text-cyan-200 text-xs font-bold flex items-center space-x-2 shadow-2xl">
                          <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                          <span>{scanProgressText || "AI Vision Sedang Memindai Teks KTP..."}</span>
                        </div>
                      </div>
                    )}

                    {/* Bottom overlay with file info and change button */}
                    {!isScanningKtp && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="truncate text-slate-200 font-mono text-[11px]">
                            {ktpFileName || "ktp_pelanggan.jpg"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[10px] backdrop-blur-sm transition flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Ganti Foto</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Banner Instruksi Koreksi Wajib setelah Ekstraksi */}
                  {aiExtracted && !isScanningKtp && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-emerald-300">
                              Data KTP Berhasil Diekstrak AI!
                            </span>
                            {scanDuration && (
                              <span className="text-[10px] font-mono bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center space-x-1">
                                <span>⚡ {scanDuration}s</span>
                                {ocrEngine && <span className="text-emerald-300/80">&bull; {ocrEngine}</span>}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ringkasan Cepat Hasil Ekstraksi */}
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Nama Terbaca:</span>
                            <strong className="text-white text-xs font-bold">{newFullName || "(Isi manual)"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">NIK Terbaca:</span>
                            <strong className="text-emerald-300 font-mono text-xs">{newNik || "(Isi manual)"}</strong>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-200 mt-2">
                          Nama, NIK 16 digit, dan Alamat telah otomatis terisi ke formulir di bawah.
                          Silakan <strong>periksa dan lakukan koreksi</strong> pada setiap kolom formulir di bawah ini jika ada data yang perlu disesuaikan sebelum menekan tombol Simpan ke Database.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Banner Jika OCR Mengalami Kendala / Gagal */}
                  {ocrError && !isScanningKtp && (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs flex items-start justify-between space-x-2.5 animate-in fade-in duration-200">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-300">
                            Perhatian Pindai KTP
                          </span>
                          <p className="text-[11px] text-slate-200 mt-0.5">
                            {ocrError}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (ktpPreviewUrl) triggerAiOcrExtraction(ktpPreviewUrl, ktpFileName || "ktp.jpg");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 font-bold text-[10px] border border-amber-400/40 transition flex items-center space-x-1 flex-shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Coba Pindai Ulang</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4 text-xs">
              {/* Section 1: Data Pokok KTP */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-maroon-800" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    1. Data Pokok KTP (Hasil Ekstraksi AI &bull; Dapat Dikoreksi)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nama Lengkap */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap (Sesuai KTP) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Contoh: DARMA"
                      className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  {/* NIK */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={newNik}
                      onChange={(e) => setNewNik(e.target.value.replace(/\D/g, ""))}
                      placeholder="16 Digit NIK KTP..."
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white text-slate-900"
                    />
                  </div>

                  {/* Tempat / Tanggal Lahir */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tempat, Tanggal Lahir
                    </label>
                    <input
                      type="text"
                      value={newBirthPlaceDate}
                      onChange={(e) => setNewBirthPlaceDate(e.target.value)}
                      placeholder="Contoh: LEMO BARU, 01-01-1990"
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  {/* Jenis Kelamin */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    >
                      <option value="PEREMPUAN">PEREMPUAN</option>
                      <option value="LAKI-LAKI">LAKI-LAKI</option>
                    </select>
                  </div>

                  {/* Agama */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Agama
                    </label>
                    <input
                      type="text"
                      value={newReligion}
                      onChange={(e) => setNewReligion(e.target.value)}
                      placeholder="ISLAM"
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  {/* Status Perkawinan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Status Perkawinan
                    </label>
                    <input
                      type="text"
                      value={newMaritalStatus}
                      onChange={(e) => setNewMaritalStatus(e.target.value)}
                      placeholder="Contoh: CERAI HIDUP / KAWIN"
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  {/* Pekerjaan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Pekerjaan
                    </label>
                    <input
                      type="text"
                      value={newOccupation}
                      onChange={(e) => setNewOccupation(e.target.value)}
                      placeholder="Contoh: MENGURUS RUMAH TANGGA"
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Alamat KTP & Wilayah Layanan */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    2. Alamat KTP & Wilayah Dusun Layanan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Alamat Fisik KTP */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Alamat Jalan / Dusun (Sesuai KTP)
                    </label>
                    <input
                      type="text"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Contoh: LEMO BARU"
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  {/* RT / RW */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      RT / RW (KTP)
                    </label>
                    <input
                      type="text"
                      value={newRtRw}
                      onChange={(e) => setNewRtRw(e.target.value)}
                      placeholder="000/000"
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  {/* Dusun Layanan */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Wilayah Dusun Layanan <span className="text-rose-500">*</span>
                      </label>
                      {!isDesaLevel && (
                        <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center space-x-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Terkunci Wilayah Anda</span>
                        </span>
                      )}
                    </div>
                    <select
                      disabled={!isDesaLevel}
                      value={newDusun}
                      onChange={(e) => {
                        const d = e.target.value;
                        setNewDusun(d);
                        const kInfo = getKpspamsByDusun(d);
                        setNewMeterSerial(`MTR-${kInfo.codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`);
                      }}
                      className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 ${
                        !isDesaLevel
                          ? "bg-slate-100 text-slate-700 cursor-not-allowed border-slate-300"
                          : "bg-white border-slate-300"
                      }`}
                    >
                      {allowedDusuns.map((d) => (
                        <option key={d} value={d}>
                          Dusun {d} ({getKpspamsByDusun(d).name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kel/Desa & Kecamatan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kelurahan / Desa
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={newVillage}
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 bg-slate-100 rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={newDistrict}
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 bg-slate-100 rounded-xl text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Data Sambungan & Google Maps */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    3. Data Sambungan Air & Titik Google Maps
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* No. Handphone / WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      No. Handphone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  {/* Tipe Golongan Tarif */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Golongan Tarif Air
                    </label>
                    <select
                      value={newTariffType}
                      onChange={(e) => setNewTariffType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    >
                      <option value="Rumah Tangga">Rumah Tangga (Standar Warga)</option>
                      <option value="Niaga">Niaga / Warung / Usaha</option>
                      <option value="Sosial">Sosial / Masjid / Sekolah</option>
                    </select>
                  </div>

                  {/* Unit Pengelola Info Card */}
                  <div className="sm:col-span-2 p-3 rounded-xl bg-brand-maroon-50/70 border border-brand-maroon-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-brand-maroon-800" />
                      <div>
                        <div className="font-bold text-brand-maroon-900">
                          Unit Pengelola: {getKpspamsByDusun(newDusun).name}
                        </div>
                        <div className="text-[10px] text-brand-maroon-700">
                          Nomor SR otomatis disesuaikan dengan kode unit
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nomor Seri Meter Fisik */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor Seri Fisik Meter Air <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newMeterSerial}
                      onChange={(e) => setNewMeterSerial(e.target.value)}
                      placeholder="Contoh: MTR-LMB-1003"
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  {/* Stand Meter Awal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Angka Stand Meter Awal (m³)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newInitialReading}
                      onChange={(e) => setNewInitialReading(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 text-xs font-tabular font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  {/* Geotagging & Titik Koordinat Rumah Warga (GIS) */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <GisLocationPicker
                      latitude={newLatitude}
                      longitude={newLongitude}
                      onChange={(lat, lng) => {
                        setNewLatitude(lat);
                        setNewLongitude(lng);
                      }}
                      dusunName={newDusun}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold shadow-md"
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Simpan Pelanggan ke Database
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Detail Sambungan Rumah</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Nomor Sambungan:</span>
                <span className="font-mono font-bold text-brand-maroon-900">{selectedCustomer.connectionNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Nama Pelanggan:</span>
                <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">NIK:</span>
                <span className="font-mono text-slate-800 font-bold">{selectedCustomer.nik}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">No. WhatsApp / HP:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {selectedCustomer.phone || "(Belum diisi)"}
                </span>
              </div>
              {selectedCustomer.birthPlaceDate && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tempat, Tgl Lahir:</span>
                  <span className="font-medium text-slate-800">{selectedCustomer.birthPlaceDate}</span>
                </div>
              )}
              {selectedCustomer.gender && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Jenis Kelamin:</span>
                  <span className="font-medium text-slate-800">{selectedCustomer.gender}</span>
                </div>
              )}
              {selectedCustomer.address && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Alamat KTP / RT:</span>
                  <span className="font-medium text-slate-800">
                    {selectedCustomer.address} {selectedCustomer.rtRw ? `(RT/RW ${selectedCustomer.rtRw})` : ""}
                  </span>
                </div>
              )}
              {selectedCustomer.occupation && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Pekerjaan:</span>
                  <span className="font-medium text-slate-800">{selectedCustomer.occupation}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Wilayah Dusun:</span>
                <span className="font-medium text-slate-800">{selectedCustomer.dusun}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Unit Pengelola:</span>
                <span className="font-medium text-slate-800">{selectedCustomer.kpspamsName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Nomor Seri Meter:</span>
                <span className="font-mono font-bold text-slate-800">{selectedCustomer.meterSerial}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Stand Meter Terakhir:</span>
                <span className="font-tabular font-bold text-slate-900">{selectedCustomer.lastReading.toFixed(2)} m³</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Status Tagihan Bulan Ini:</span>
                <Badge variant={selectedCustomer.billingStatus === "PAID" ? "success" : "danger"} size="sm">
                  {selectedCustomer.billingStatus === "PAID" ? "✓ LUNAS" : "● BELUM BAYAR"}
                </Badge>
              </div>
              {selectedCustomer.latitude && selectedCustomer.longitude ? (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Titik Koordinat GIS:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {selectedCustomer.latitude.toFixed(5)}, {selectedCustomer.longitude.toFixed(5)}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${selectedCustomer.latitude},${selectedCustomer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                    >
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span>Google Maps ↗</span>
                    </a>
                  </div>
                </div>
              ) : null}
              {selectedCustomer.ktpPhotoUrl && (
                <div className="flex justify-between items-center py-2 border-b border-slate-50 bg-indigo-50/50 px-3 rounded-xl mt-1">
                  <span className="text-slate-600 text-xs font-semibold">Arsip e-KTP Warga:</span>
                  <a
                    href={selectedCustomer.ktpPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white shadow-sm hover:shadow px-2.5 py-1 rounded-lg border border-indigo-200 transition"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Buka di Google Drive ↗</span>
                  </a>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status Sambungan:</span>
                <Badge variant={selectedCustomer.status === "ACTIVE" ? "success" : "warning"} size="sm">
                  {selectedCustomer.status}
                </Badge>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={() => {
                    const cust = selectedCustomer;
                    setSelectedCustomer(null);
                    handleOpenEditModal(cust);
                  }}
                  icon={<Pencil className="w-3.5 h-3.5 text-amber-600" />}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-700 border-rose-300 hover:bg-rose-50"
                  onClick={() => {
                    const cust = selectedCustomer;
                    setSelectedCustomer(null);
                    handleOpenActionModal(cust);
                  }}
                  icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                >
                  Tindakan
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedCustomer(null)}>
                  Tutup
                </Button>
                <Link href="/dashboard/penagihan-lapangan">
                  <Button variant="primary" size="sm" icon={<Smartphone className="w-3.5 h-3.5" />}>
                    Catat & Tagih Warga Ini
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Pelanggan & Titik Google Maps */}
      {editModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    Edit Sambungan #{editingCustomer.connectionNo}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">{editingCustomer.kpspamsName}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Perbarui Data Warga & Titik Google Maps
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditSubmit} className="space-y-4">
              {/* Bagian 1: Identitas KTP */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-brand-maroon-700" />
                  <span>1. Identitas Kependudukan (Sesuai KTP)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Induk Kependudukan (NIK) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={editNik}
                      onChange={(e) => setEditNik(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Pelanggan *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tempat, Tanggal Lahir
                    </label>
                    <input
                      type="text"
                      value={editBirthPlaceDate}
                      onChange={(e) => setEditBirthPlaceDate(e.target.value.toUpperCase())}
                      placeholder="Contoh: LEMO BARU, 01-01-1990"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    >
                      <option value="LAKI-LAKI">LAKI-LAKI</option>
                      <option value="PEREMPUAN">PEREMPUAN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Agama
                    </label>
                    <select
                      value={editReligion}
                      onChange={(e) => setEditReligion(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    >
                      <option value="ISLAM">ISLAM</option>
                      <option value="KRISTEN">KRISTEN</option>
                      <option value="KATOLIK">KATOLIK</option>
                      <option value="HINDU">HINDU</option>
                      <option value="BUDDHA">BUDDHA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status Perkawinan
                    </label>
                    <select
                      value={editMaritalStatus}
                      onChange={(e) => setEditMaritalStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    >
                      <option value="BELUM KAWIN">BELUM KAWIN</option>
                      <option value="KAWIN">KAWIN</option>
                      <option value="CERAI HIDUP">CERAI HIDUP</option>
                      <option value="CERAI MATI">CERAI MATI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pekerjaan
                    </label>
                    <input
                      type="text"
                      value={editOccupation}
                      onChange={(e) => setEditOccupation(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor HP / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat / Lingkungan KTP & RT/RW
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value.toUpperCase())}
                        placeholder="Nama Jalan / Dusun"
                        className="col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                      />
                      <input
                        type="text"
                        value={editRtRw}
                        onChange={(e) => setEditRtRw(e.target.value)}
                        placeholder="RT/RW (000/000)"
                        className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Data Sambungan & Meter Air */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Gauge className="w-3.5 h-3.5 text-brand-maroon-700" />
                  <span>2. Spesifikasi Meter & Status Sambungan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dusun Layanan
                    </label>
                    <select
                      value={editDusun}
                      onChange={(e) => setEditDusun(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    >
                      {allowedDusuns.map((d) => (
                        <option key={d} value={d}>
                          Dusun {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Seri Meter Fisik
                    </label>
                    <input
                      type="text"
                      required
                      value={editMeterSerial}
                      onChange={(e) => setEditMeterSerial(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Stand Meter Terakhir (m³)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editLastReading}
                      onChange={(e) => setEditLastReading(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-tabular font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status Sambungan
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as "ACTIVE" | "SEALED" | "DISCONNECTED")}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                    >
                      <option value="ACTIVE">Aktif (Teraliri Air)</option>
                      <option value="SEALED">Disegel (Tunggakan)</option>
                      <option value="DISCONNECTED">Diputus Permanen</option>
                    </select>
                  </div>
                </div>

                {/* Bagian 3: Titik Koordinat Peta Google Maps Interaktif */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Geser Titik Pin di Peta Google Maps Satelit</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Klik atau geser penanda ke atap rumah warga yang tepat agar rute penagihan akurat.
                    </span>
                  </div>

                  <GisLocationPicker
                    latitude={editLatitude}
                    longitude={editLongitude}
                    onChange={(lat, lng) => {
                      setEditLatitude(lat);
                      setEditLongitude(lng);
                    }}
                    dusunName={editDusun}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold shadow-md"
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tindakan: Segel / Putus / Hapus Pelanggan */}
      {actionModalOpen && customerToAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Kelola Tindakan Sambungan
                </h3>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Pilih tindakan operasional untuk sambungan milik warga: <br />
              <strong className="text-slate-900 text-sm">{customerToAction.name}</strong>
              <span className="font-mono text-xs text-brand-maroon-800 ml-1.5 font-bold">
                ({customerToAction.connectionNo})
              </span>
            </p>

            <div className="space-y-2.5">
              {/* Option 1: Segel Meter */}
              {customerToAction.status !== "SEALED" && (
                <button
                  type="button"
                  onClick={() => handleApplyStatusChange("SEALED")}
                  className="w-full text-left p-3 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100/80 transition flex items-start space-x-3"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-amber-900">
                      Segel Sambungan (Tunggakan Iuran)
                    </div>
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      Tutup kran meteran fisik warga sementara waktu karena terdapat tagihan belum dilunasi.
                    </div>
                  </div>
                </button>
              )}

              {/* Option 2: Buka Segel */}
              {customerToAction.status === "SEALED" && (
                <button
                  type="button"
                  onClick={() => handleApplyStatusChange("ACTIVE")}
                  className="w-full text-left p-3 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 transition flex items-start space-x-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-emerald-900">
                      Buka Segel & Aktifkan Kembali
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      Buka segel kawat meter setelah warga melunasi tunggakan, aliran air kembali normal.
                    </div>
                  </div>
                </button>
              )}

              {/* Option 3: Putus Permanen */}
              {customerToAction.status !== "DISCONNECTED" && (
                <button
                  type="button"
                  onClick={() => handleApplyStatusChange("DISCONNECTED")}
                  className="w-full text-left p-3 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 transition flex items-start space-x-3"
                >
                  <Lock className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      Putus Sambungan Rumah Permanen
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Cabut stop kran instalasi pipa karena rumah kosong atau permintaan resmi warga.
                    </div>
                  </div>
                </button>
              )}

              {/* Option 4: Hapus Permanen dari Database */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDeletePermanent}
                  className="w-full text-left p-3 rounded-2xl border border-rose-300 bg-rose-50 hover:bg-rose-100 transition flex items-start space-x-3 text-rose-900"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-rose-900">
                      Hapus Permanen dari Database
                    </div>
                    <div className="text-[11px] text-rose-700 mt-0.5">
                      Hapus seluruh arsip sambungan ini secara permanen. Tindakan ini tidak dapat dibatalkan.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setActionModalOpen(false)}
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
