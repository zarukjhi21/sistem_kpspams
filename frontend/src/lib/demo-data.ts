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
    name: 'KPSPAMS Lemo Baru',
    dusuns: ['Dusun Lemo Baru'],
    head: 'Hasanuddin',
    activeCustomers: 185,
    waterUsageThisMonth: 0,
    totalBilled: 0,
    totalCollected: 0,
    outstandingArrears: 0,
    cashBalance: 0,
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
    activeCustomers: 142,
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
    activeCustomers: 278,
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
    name: 'H. Muhammad Basir, S.Sos.',
    role: 'pemerintah_desa',
    roleLabel: 'Kepala Desa (Pemdes)',
    kpspamsId: null,
    kpspamsName: 'Monitoring Eksekutif Desa',
    phone: '081111111103',
  },
  {
    id: 4,
    username: 'ketua.lemobaru',
    name: 'Hasanuddin',
    role: 'ketua_kpspams',
    roleLabel: 'Ketua KPSPAMS',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS Lemo Baru',
    phone: '082100000001',
  },
  {
    id: 5,
    username: 'admin.lemobaru',
    name: 'Nurul Hidayah',
    role: 'admin_kpspams',
    roleLabel: 'Admin KPSPAMS',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS Lemo Baru',
    phone: '082100000002',
  },
  {
    id: 6,
    username: 'bendahara.lemobaru',
    name: 'Rahmawati',
    role: 'bendahara_kpspams',
    roleLabel: 'Bendahara KPSPAMS',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS Lemo Baru',
    phone: '082100000003',
  },
  {
    id: 7,
    username: 'petugas.lemobaru',
    name: 'Syamsul Bahri (Petugas LMB)',
    role: 'petugas_lapangan',
    roleLabel: 'Petugas Lapangan',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS Lemo Baru',
    phone: '082100000004',
  },
  {
    id: 9,
    username: 'petugas.lemotua',
    name: 'Hendra Saputra (Petugas LMT)',
    role: 'petugas_lapangan',
    roleLabel: 'Petugas Lapangan',
    kpspamsId: 2,
    kpspamsName: 'KPSPAMS Lemo Tua',
    phone: '082100000005',
  },
  {
    id: 10,
    username: 'petugas.sarampu1',
    name: 'Syahrul Ramadhan (Petugas SR1)',
    role: 'petugas_lapangan',
    roleLabel: 'Petugas Lapangan',
    kpspamsId: 3,
    kpspamsName: 'KPSPAMS Sarampu 1',
    phone: '082100000006',
  },
  {
    id: 8,
    username: 'warga.yusuf',
    name: 'Muhammad Yusuf',
    role: 'pelanggan',
    roleLabel: 'Warga / Pelanggan',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS Lemo Baru',
    phone: '085242000001',
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
  // Dusun Lemo Baru (KPSPAMS Lemo Baru)
  {
    id: 1,
    connectionNo: 'SR-LMB-00001',
    name: 'Muhammad Yusuf',
    nik: '7604031508850001',
    phone: '085242111001',
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
  {
    id: 2,
    connectionNo: 'SR-LMB-00002',
    name: 'Baharuddin S.',
    nik: '7604031405820005',
    phone: '085242111002',
    dusun: 'Lemo Baru',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS Lemo Baru',
    meterSerial: 'MTR-LMB-1002',
    lastReading: 210.00,
    status: 'ACTIVE',
    tariffType: 'Rumah Tangga',
    latitude: -3.4595,
    longitude: 119.3428,
    billingStatus: 'UNPAID',
  },
  {
    id: 7,
    connectionNo: 'SR-LMB-00003',
    name: 'H. Kamaruddin Basri',
    nik: '7604031508850009',
    phone: '085242111003',
    dusun: 'Lemo Baru',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS Lemo Baru',
    meterSerial: 'MTR-LMB-1003',
    lastReading: 12.00,
    status: 'ACTIVE',
    tariffType: 'Rumah Tangga',
    latitude: -3.4565,
    longitude: 119.3435,
    billingStatus: 'UNPAID',
  },
  {
    id: 8,
    connectionNo: 'SR-LMB-00004',
    name: 'Ibu Salmawati',
    nik: '7604032103870008',
    phone: '085242111004',
    dusun: 'Lemo Baru',
    kpspamsId: 1,
    kpspamsName: 'KPSPAMS Lemo Baru',
    meterSerial: 'MTR-LMB-1004',
    lastReading: 178.20,
    status: 'ACTIVE',
    tariffType: 'Rumah Tangga',
    latitude: -3.4588,
    longitude: 119.3398,
    billingStatus: 'UNPAID',
  },

  // Dusun Lemo Tua (KPSPAMS Lemo Tua)
  {
    id: 3,
    connectionNo: 'SR-LMT-00001',
    name: 'Siti Aminah',
    nik: '7604031206820002',
    phone: '085242112001',
    dusun: 'Lemo Tua',
    kpspamsId: 2,
    kpspamsName: 'KPSPAMS Lemo Tua',
    meterSerial: 'MTR-LMT-2001',
    lastReading: 185.00,
    status: 'ACTIVE',
    tariffType: 'Rumah Tangga',
    latitude: -3.4625,
    longitude: 119.3380,
    billingStatus: 'UNPAID',
  },
  {
    id: 4,
    connectionNo: 'SR-LMT-00002',
    name: 'Zulkifli Mansyur',
    nik: '7604032009800006',
    phone: '085242112002',
    dusun: 'Lemo Tua',
    kpspamsId: 2,
    kpspamsName: 'KPSPAMS Lemo Tua',
    meterSerial: 'MTR-LMT-2002',
    lastReading: 95.20,
    status: 'SEALED',
    tariffType: 'Rumah Tangga',
    latitude: -3.4640,
    longitude: 119.3395,
    billingStatus: 'UNPAID',
  },
  {
    id: 9,
    connectionNo: 'SR-LMT-00003',
    name: 'Mansyur Dg. Bella',
    nik: '7604031808790001',
    phone: '085242112003',
    dusun: 'Lemo Tua',
    kpspamsId: 2,
    kpspamsName: 'KPSPAMS Lemo Tua',
    meterSerial: 'MTR-LMT-2003',
    lastReading: 140.00,
    status: 'ACTIVE',
    tariffType: 'Rumah Tangga',
    latitude: -3.4615,
    longitude: 119.3362,
    billingStatus: 'UNPAID',
  },

  // Dusun Sarampu 1 & Pakkandoang (KPSPAMS Sarampu 1)
  {
    id: 5,
    connectionNo: 'SR-SR1-00001',
    name: 'H. Dahlan Tahir',
    nik: '7604032504780003',
    phone: '085242113001',
    dusun: 'Sarampu 1',
    kpspamsId: 3,
    kpspamsName: 'KPSPAMS Sarampu 1',
    meterSerial: 'MTR-SR1-3001',
    lastReading: 320.00,
    status: 'ACTIVE',
    tariffType: 'Rumah Tangga',
    latitude: -3.4670,
    longitude: 119.3495,
    billingStatus: 'UNPAID',
  },
  {
    id: 6,
    connectionNo: 'SR-PKD-00001',
    name: 'Rustam Effendi',
    nik: '7604031011900004',
    phone: '085242113002',
    dusun: 'Pakkandoang',
    kpspamsId: 3,
    kpspamsName: 'KPSPAMS Sarampu 1',
    meterSerial: 'MTR-PKD-3002',
    lastReading: 156.40,
    status: 'ACTIVE',
    tariffType: 'Rumah Tangga',
    latitude: -3.4710,
    longitude: 119.3520,
    billingStatus: 'UNPAID',
  },
  {
    id: 10,
    connectionNo: 'SR-SR1-00002',
    name: 'Sukardi Syam',
    nik: '7604030704840007',
    phone: '085242113003',
    dusun: 'Sarampu 1',
    kpspamsId: 3,
    kpspamsName: 'KPSPAMS Sarampu 1',
    meterSerial: 'MTR-SR1-3003',
    lastReading: 215.80,
    status: 'ACTIVE',
    tariffType: 'Rumah Tangga',
    latitude: -3.4692,
    longitude: 119.3480,
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
    invoiceNo: 'INV/202610/KP01/A8F12',
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
  {
    id: 102,
    invoiceNo: 'INV/202610/KP01/B7C34',
    customerName: 'Baharuddin S.',
    connectionNo: 'SR-LMB-00002',
    dusun: 'Lemo Baru',
    kpspamsId: 1,
    period: 'Oktober 2026',
    usageM3: 18.00,
    totalAmount: 13000, // Aturan Lemo Baru: Rp10.000 (15 m³) + (3 m³ x Rp1.000) = Rp13.000
    status: 'PAID',
    dueDate: '2026-10-20',
  },
  {
    id: 103,
    invoiceNo: 'INV/202610/KP02/C9D56',
    customerName: 'Siti Aminah',
    connectionNo: 'SR-LMT-00001',
    dusun: 'Lemo Tua',
    kpspamsId: 2,
    period: 'Oktober 2026',
    usageM3: 12.00,
    totalAmount: 32000,
    status: 'UNPAID',
    dueDate: '2026-10-20',
  },
  {
    id: 104,
    invoiceNo: 'INV/202610/KP03/D1E78',
    customerName: 'H. Dahlan Tahir',
    connectionNo: 'SR-SR1-00001',
    dusun: 'Sarampu 1',
    kpspamsId: 3,
    period: 'Oktober 2026',
    usageM3: 25.00,
    totalAmount: 62500,
    status: 'PAID',
    dueDate: '2026-10-20',
  },
  {
    id: 105,
    invoiceNo: 'INV/202610/KP03/E2F90',
    customerName: 'Rustam Effendi',
    connectionNo: 'SR-PKD-00001',
    dusun: 'Pakkandoang',
    kpspamsId: 3,
    period: 'Oktober 2026',
    usageM3: 16.00,
    totalAmount: 37500,
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
