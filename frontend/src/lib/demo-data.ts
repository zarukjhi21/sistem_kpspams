/**
 * Demo Data Resmi SI-KPSPAMS Desa Kuajang
 * Digunakan untuk visualisasi antarmuka interaktif, pengetesan konteks KPSPAMS, dan prototipe presisi.
 */

export interface DemoKpspams {
  id: number;
  code: string;
  name: string;
  dusuns: string[];
  head: string;
  activeCustomers: number;
  waterUsageThisMonth: number;
  totalBilled: number;
  totalCollected: number;
  outstandingArrears: number;
  cashBalance: number;
  activeComplaints: number;
  systemType: 'GRAVITASI' | 'SUMUR_BOR';
  waterSource: string;
  hasElectricityCost: boolean;
}

export const DEMO_KPSPAMS_LIST: DemoKpspams[] = [
  {
    id: 1,
    code: 'KP-LMB',
    name: 'KPSPAMS "Wai Kaili" Lemo Baru',
    dusuns: ['Dusun Lemo Baru'],
    head: 'Fadli',
    activeCustomers: 37, // 37 SR Aktif Terverifikasi Server
    waterUsageThisMonth: 353,
    totalBilled: 370000,
    totalCollected: 370000,
    outstandingArrears: 0,
    cashBalance: 370000,
    activeComplaints: 0,
    systemType: 'GRAVITASI',
    waterSource: 'Mata Air Alami Pegunungan (Sistem Gravitasi Murni - Tanpa Pompa Listrik)',
    hasElectricityCost: false,
  },
  {
    id: 2,
    code: 'KP-LMT',
    name: 'KPSPAMS Lemo Tua',
    dusuns: ['Dusun Lemo Tua'],
    head: 'Abdul Rauf',
    activeCustomers: 0, // Persiapan infrastruktur
    waterUsageThisMonth: 0,
    totalBilled: 0,
    totalCollected: 0,
    outstandingArrears: 0,
    cashBalance: 0,
    activeComplaints: 0,
    systemType: 'SUMUR_BOR',
    waterSource: 'Sumur Bor Dalam (Pompa Submersible Listrik PLN)',
    hasElectricityCost: true,
  },
  {
    id: 3,
    code: 'KP-SR1',
    name: 'KPSPAMS Sarampu 1',
    dusuns: ['Dusun Sarampu 1', 'Dusun Pakkandoang'],
    head: 'Drs. Usman Ali',
    activeCustomers: 0, // Persiapan infrastruktur
    waterUsageThisMonth: 0,
    totalBilled: 0,
    totalCollected: 0,
    outstandingArrears: 0,
    cashBalance: 0,
    activeComplaints: 0,
    systemType: 'SUMUR_BOR',
    waterSource: 'Sumur Bor Dalam (Pompa Submersible Listrik PLN)',
    hasElectricityCost: true,
  },
];

export interface DemoUser {
  id: number;
  username: string;
  name: string;
  role: 'super_admin' | 'admin_desa' | 'pemerintah_desa' | 'ketua_kpspams' | 'admin_kpspams' | 'bendahara_kpspams' | 'petugas_lapangan' | 'pelanggan';
  roleLabel: string;
  kpspamsId: number | null;
  kpspamsName: string | null;
  phone: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 1,
    username: 'superadmin',
    name: 'Super Administrator TI',
    role: 'super_admin',
    roleLabel: 'Super Admin',
    kpspamsId: null,
    kpspamsName: 'Sistem Global',
    phone: '081111111101',
  },
  {
    id: 2,
    username: 'admin.desa',
    name: 'Operator TI Desa Kuajang',
    role: 'admin_desa',
    roleLabel: 'Admin Desa',
    kpspamsId: null,
    kpspamsName: 'Pemerintah Desa Kuajang (Seluruh Unit)',
    phone: '081111111102',
  },
  {
    id: 3,
    username: 'kades.kuajang',
    name: 'H. Muhammad S.',
    role: 'pemerintah_desa',
    roleLabel: 'Kepala Desa Kuajang',
    kpspamsId: null,
    kpspamsName: 'Pemerintah Desa Kuajang',
    phone: '081111111103',
  },
  {
    id: 4,
    username: 'ketua.lemobaru',
    name: 'Fadli',
    role: 'ketua_kpspams',
    roleLabel: 'Ketua KPSPAMS',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS "Wai Kaili" Lemo Baru',
    phone: '082100000001',
  },
  {
    id: 5,
    username: 'sekretaris.lemobaru',
    name: 'Mada Ali',
    role: 'admin_kpspams',
    roleLabel: 'Sekretaris KPSPAMS',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS "Wai Kaili" Lemo Baru',
    phone: '082100000002',
  },
  {
    id: 6,
    username: 'bendahara.lemobaru',
    name: 'M. Darmawan',
    role: 'bendahara_kpspams',
    roleLabel: 'Bendahara KPSPAMS',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS "Wai Kaili" Lemo Baru',
    phone: '082100000003',
  },
  {
    id: 7,
    username: 'suardi.lemobaru',
    name: 'Suardi',
    role: 'petugas_lapangan',
    roleLabel: 'Koordinator Penagihan',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS "Wai Kaili" Lemo Baru',
    phone: '082100000004',
  },
  {
    id: 8,
    username: 'sapri.lemobaru',
    name: 'Sapri',
    role: 'petugas_lapangan',
    roleLabel: 'Koordinator Pemeliharaan',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS "Wai Kaili" Lemo Baru',
    phone: '082100000005',
  },
  {
    id: 9,
    username: 'abdulwahab.lemobaru',
    name: 'Abdul Wahab',
    role: 'petugas_lapangan',
    roleLabel: 'Anggota Pengurus',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS "Wai Kaili" Lemo Baru',
    phone: '082100000006',
  },
  {
    id: 10,
    username: 'nurhanuddin.lemobaru',
    name: 'Nurhanuddin',
    role: 'petugas_lapangan',
    roleLabel: 'Anggota Pengurus',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS "Wai Kaili" Lemo Baru',
    phone: '082100000007',
  },
];

export interface DemoCustomer {
  id: number;
  connectionNo: string;
  name: string;
  nik: string;
  birthPlaceDate?: string;
  gender?: 'LAKI-LAKI' | 'PEREMPUAN' | string;
  address?: string;
  rtRw?: string;
  village?: string;
  district?: string;
  religion?: string;
  maritalStatus?: string;
  occupation?: string;
  phone?: string;
  dusun: string;
  kpspamsId: number;
  kpspamsName: string;
  meterSerial: string;
  lastReading: number;
  status: 'ACTIVE' | 'SEALED' | 'DISCONNECTED';
  tariffType: string;
  latitude?: number;
  longitude?: number;
  billingStatus?: 'PAID' | 'UNPAID';
  ktpPhotoUrl?: string;
}

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  // Dusun Lemo Baru (KPSPAMS Lemo Baru) - Data Riil Terverifikasi
  {
    id: 1,
    connectionNo: 'SR-LMB-00001',
    name: 'Muhammad Yusuf',
    nik: '7604031508850001',
    phone: '085242000001',
    dusun: 'Lemo Baru',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS Lemo Baru',
    meterSerial: 'MTR-LMB-1001',
    lastReading: 142.50,
    status: 'ACTIVE',
    tariffType: 'Rumah Tangga',
    latitude: -3.4578,
    longitude: 119.3412,
    billingStatus: 'UNPAID',
  },
];

export interface DemoInvoice {
  id: number;
  invoiceNo: string;
  customerName: string;
  connectionNo: string;
  dusun: string;
  kpspamsId: number;
  period: string;
  usageM3: number;
  totalAmount: number;
  status: 'PAID' | 'UNPAID' | 'PARTIAL' | 'VOIDED';
  dueDate: string;
}

export const DEMO_INVOICES: DemoInvoice[] = [
  {
    id: 101,
    invoiceNo: 'INV/202610/KP01/41C5FD',
    customerName: 'Muhammad Yusuf',
    connectionNo: 'SR-LMB-00001',
    dusun: 'Lemo Baru',
    kpspamsId: 1,
    period: 'Oktober 2026',
    usageM3: 14.50,
    totalAmount: 10000, // Aturan Lemo Baru: Rp10.000 s/d 15 m³
    status: 'UNPAID',
    dueDate: '2026-10-20',
  },
];

/**
 * Kalkulator Tarif Air Resmi KPSPAMS Desa Kuajang
 * Khusus Lemo Baru: Beban dasar Rp10.000 sampai 15 m³. Lebih dari 15 m³ dihitung Rp1.000/m³.
 */
export function calculateWaterBill(kpspamsId: number, usageM3: number) {
  if (kpspamsId === 1) {
    const baseFee = 10000;
    const baseThreshold = 15;
    const excessM3 = Math.max(0, usageM3 - baseThreshold);
    const ratePerExcess = 1000;
    const excessFee = excessM3 * ratePerExcess;
    const totalAmount = baseFee + excessFee;

    const formulaDescription =
      excessM3 > 0
        ? `Paket Dasar (0-15 m³): Rp 10.000 + Kelebihan (${excessM3.toFixed(2)} m³ × Rp 1.000): Rp ${excessFee.toLocaleString('id-ID')}`
        : `Paket Dasar Bulanan (0-15 m³): Rp 10.000 (Pemakaian: ${usageM3.toFixed(2)} m³)`;

    return {
      kpspamsName: 'KPSPAMS Lemo Baru',
      systemType: 'GRAVITASI' as const,
      systemLabel: 'Sistem Gravitasi Alami (Mata Air Pegunungan)',
      electricityNote: 'Bebas Beban Listrik PLN (Operasional Hanya Pemeliharaan Pipa Transmisi & Kaporit)',
      baseFee,
      baseThreshold,
      excessM3,
      ratePerExcess,
      excessFee,
      totalAmount,
      formulaDescription,
    };
  }

  // Unit KPSPAMS lainnya (Lemo Tua & Sarampu 1 / Pakkandoang)
  const baseFee = 7500;
  const waterRate = 2000;
  const totalAmount = baseFee + (usageM3 * waterRate);
  return {
    kpspamsName: kpspamsId === 2 ? 'KPSPAMS Lemo Tua' : 'KPSPAMS Sarampu 1',
    systemType: 'SUMUR_BOR' as const,
    systemLabel: 'Sistem Sumur Bor Dalam (Pompa Listrik Submersible)',
    electricityNote: 'Komponen Tarif Memperhitungkan Biaya Daya Listrik PLN Pompa Bor',
    baseFee,
    baseThreshold: 0,
    excessM3: usageM3,
    ratePerExcess: waterRate,
    excessFee: usageM3 * waterRate,
    totalAmount,
    formulaDescription: `Abonemen Standar: Rp 7.500 + Pemakaian (${usageM3.toFixed(2)} m³ × Rp 2.000): Rp ${(usageM3 * waterRate).toLocaleString('id-ID')}`,
  };
}
