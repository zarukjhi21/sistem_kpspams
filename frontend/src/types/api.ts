export interface Kpspams {
  id: number;
  code: string;
  name: string;
  decree_number?: string;
  contact_phone?: string;
  is_active: boolean;
}

export interface Dusun {
  id: number;
  desa_id: number;
  code: string;
  name: string;
  notes?: string;
}

export interface Customer {
  id: number;
  kpspams_id: number;
  customer_type_id: number;
  code: string;
  nik: string;
  no_kk?: string;
  full_name: string;
  phone: string;
  email?: string;
  identity_address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Connection {
  id: number;
  kpspams_id: number;
  customer_id: number;
  dusun_id: number;
  connection_no: string;
  address_detail: string;
  latitude?: number;
  longitude?: number;
  status: 'ACTIVE' | 'SEALED' | 'DISCONNECTED' | 'TERMINATED';
  installed_date: string;
}

export interface MeterReading {
  id: number;
  kpspams_id: number;
  billing_period_id: number;
  connection_id: number;
  reading_date: string;
  previous_reading: number;
  current_reading: number;
  usage_m3: number;
  meter_photo_path: string;
  status: 'PENDING' | 'VERIFIED' | 'ANOMALY_ROLLBACK' | 'ANOMALY_SPIKE' | 'REJECTED';
}

export interface Invoice {
  id: number;
  kpspams_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  usage_m3: number;
  water_amount: number;
  admin_fee: number;
  maintenance_fee: number;
  penalty_fee: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'VOIDED';
}

export interface Payment {
  id: number;
  kpspams_id: number;
  invoice_id: number;
  receipt_number: string;
  payment_date: string;
  amount_paid: number;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'QRIS';
  status: 'SUCCESS' | 'VOIDED' | 'REVERSED';
}

export interface CashAccount {
  id: number;
  kpspams_id: number;
  account_code: string;
  account_name: string;
  bank_name?: string;
  opening_balance: number;
  opening_balance_date: string;
  current_balance: number;
  is_active: boolean;
}
