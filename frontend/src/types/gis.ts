export interface MasterGisCustomer {
  id: number;
  connectionNo: string;
  name: string;
  nik?: string;
  phone?: string;
  dusun: string;
  rtRw?: string;
  kpspamsId: number;
  kpspamsName: string;
  meterSerial: string;
  lastReading: number;
  tariffType: string;
  latitude: number;
  longitude: number;
  billingStatus: "PAID" | "UNPAID";
  unpaidAmount?: number;
  meterCondition?: "GOOD" | "STUCK" | "DAMAGED" | "BROKEN" | string;
  isMeterDamaged?: boolean;
  activeComplaint?: {
    id: number;
    ticketNumber: string;
    category: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
    status: string;
    createdAt?: string;
  } | null;
}

export interface ReservoirSourceItem {
  id: string;
  name: string;
  type: "INTAKE" | "RESERVOIR" | "BREAK_PRESSURE" | "DISTRIBUTION";
  typeLabel: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  capacityLiters: number;
  debitLps?: number;
  flowSystem: string;
  dusunServed: string;
  description: string;
  operationalStatus: "NORMAL" | "MAINTENANCE" | "MONITORING";
}

// 5 Titik Infrastruktur Utama Reservoir & Sumber Air Bersih Desa Kuajang
export const VILLAGE_RESERVOIRS: ReservoirSourceItem[] = [
  {
    id: "SRC-LMB-01",
    name: "Broncaptering & Mata Air Alami Pegunungan Lemo Baru",
    type: "INTAKE",
    typeLabel: "Hulu Mata Air (Broncaptering)",
    latitude: -3.416389,
    longitude: 119.379694,
    elevationM: 145,
    capacityLiters: 15000,
    debitLps: 4.8,
    flowSystem: "Gravitasi Murni Tanpa Listrik PLN",
    dusunServed: "Dusun Lemo Baru & Salubatu",
    description:
      "Titik tangkapan air alami dari mata air pegunungan (3°24'59.0\"S 119°22'46.9\"E). Mengalir murni 24 jam dengan gravitasi alami tanpa biaya listrik.",
    operationalStatus: "NORMAL",
  },
  {
    id: "RSV-LMB-02",
    name: "Bak Pelepas Tekanan (BPT) & Penenang Lemo Baru",
    type: "BREAK_PRESSURE",
    typeLabel: "Bak Pelepas Tekanan (BPT)",
    latitude: -3.431124,
    longitude: 119.378249,
    elevationM: 95,
    capacityLiters: 25000,
    debitLps: 4.2,
    flowSystem: "Peredam Tekanan Gravitasi",
    dusunServed: "Dusun Lemo Baru (Bagian Atas & Poros Utama)",
    description:
      "Berfungsi meredam kelebihan tekanan hidrolik (water hammer) dari turunan pegunungan 145m sebelum masuk ke pipa distribusi rumah warga.",
    operationalStatus: "NORMAL",
  },
  {
    id: "RSV-LMT-03",
    name: "Bak Penampungan & Reservoir Distribusi Lemo Tua",
    type: "RESERVOIR",
    typeLabel: "Reservoir Induk Dusun",
    latitude: -3.4285,
    longitude: 119.3852,
    elevationM: 110,
    capacityLiters: 20000,
    debitLps: 3.5,
    flowSystem: "Gravitasi Sistem Terbuka",
    dusunServed: "Dusun Lemo Tua",
    description:
      "Bak penampung sentral unit KPSPAMS Lemo Tua untuk cadangan air jam sibuk rumah tangga warga.",
    operationalStatus: "NORMAL",
  },
  {
    id: "RSV-SR1-04",
    name: "Reservoir & Menara Distribusi Sarampu 1",
    type: "RESERVOIR",
    typeLabel: "Reservoir Menara Air",
    latitude: -3.438,
    longitude: 119.3685,
    elevationM: 120,
    capacityLiters: 30000,
    debitLps: 5.0,
    flowSystem: "Gravitasi & Pompa Submersible",
    dusunServed: "Dusun Sarampu 1 & Dusun Pakkandoang",
    description:
      "Menara air utama untuk menjaga kestabilan tekanan wilayah kontur datar dan perbukitan Sarampu.",
    operationalStatus: "NORMAL",
  },
  {
    id: "RSV-KBH-05",
    name: "Bak Pembagi Distribusi Kuajang Bawah",
    type: "DISTRIBUTION",
    typeLabel: "Bak Distribusi Hilir",
    latitude: -3.4349,
    longitude: 119.3742,
    elevationM: 65,
    capacityLiters: 15000,
    debitLps: 3.8,
    flowSystem: "Gravitasi Tekanan Stabil",
    dusunServed: "Pemukiman Poros Bawah Desa Kuajang",
    description:
      "Titik pemerata tekanan akhir untuk suplai air stabil ke pemukiman warga hilir dekat balai desa.",
    operationalStatus: "NORMAL",
  },
];

// Jalur Pipa Transmisi Utama Gravitasi (Cyan menyala)
export const MAIN_TRANSMISSION_PIPELINE: [number, number][] = [
  [-3.416389, 119.379694], // 1. Hulu Broncaptering Mata Air (145m dpl)
  [-3.4215, 119.3792], // 2. Turunan Pipa Transmisi Pegunungan
  [-3.4265, 119.3788], // 3. Lembah Penyalur
  [-3.431124, 119.378249], // 4. Bak Pelepas Tekanan BPT (95m dpl)
  [-3.43254, 119.3748], // 5. Percabangan Distribusi Dusun
  [-3.433259, 119.3747], // 6. Poros Utama Pemukiman
  [-3.4349, 119.3742], // 7. Bak Pembagi Kuajang Bawah (65m dpl)
];

// Jalur Cabang Distribusi Pemukiman Warga Dusun Lemo Baru (Deep Sky Blue)
export const VILLAGE_DISTRIBUTION_PIPELINE: [number, number][] = [
  [-3.431124, 119.378249], // Dari BPT
  [-3.431192, 119.376299], // Poros RT 01
  [-3.431052, 119.37589], // Titik Rumah Warga
  [-3.432611, 119.37528], // Pertigaan Dusun
  [-3.43279, 119.374909], // Jalur Pemukiman Padat
  [-3.433062, 119.374879],
  [-3.433371, 119.375868],
  [-3.433705, 119.374607], // Ujung Pemukiman
  [-3.434955, 119.374248], // Menuju Kuajang Bawah
];
