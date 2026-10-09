<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $indexes = [
            // Customers
            "CREATE INDEX IF NOT EXISTS idx_customers_kpspams_id ON customers(kpspams_id)",
            "CREATE INDEX IF NOT EXISTS idx_customers_nik ON customers(nik)",
            "CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)",
            "CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code)",
            "CREATE INDEX IF NOT EXISTS idx_customers_status_deleted ON customers(status, deleted_at)",
            "CREATE INDEX IF NOT EXISTS idx_customers_dusun ON customers(dusun)",

            // Connections
            "CREATE INDEX IF NOT EXISTS idx_connections_customer_id ON connections(customer_id)",
            "CREATE INDEX IF NOT EXISTS idx_connections_meter_id ON connections(meter_id)",
            "CREATE INDEX IF NOT EXISTS idx_connections_dusun_id ON connections(dusun_id)",
            "CREATE INDEX IF NOT EXISTS idx_connections_connection_no ON connections(connection_no)",
            "CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status)",

            // Invoices
            "CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)",
            "CREATE INDEX IF NOT EXISTS idx_invoices_connection_id ON invoices(connection_id)",
            "CREATE INDEX IF NOT EXISTS idx_invoices_kpspams_id ON invoices(kpspams_id)",
            "CREATE INDEX IF NOT EXISTS idx_invoices_billing_period_id ON invoices(billing_period_id)",
            "CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)",

            // Payments
            "CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id)",
            "CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id)",
            "CREATE INDEX IF NOT EXISTS idx_payments_kpspams_id ON payments(kpspams_id)",
            "CREATE INDEX IF NOT EXISTS idx_payments_cash_account_id ON payments(cash_account_id)",

            // Meter Readings
            "CREATE INDEX IF NOT EXISTS idx_meter_readings_connection_id ON meter_readings(connection_id)",
            "CREATE INDEX IF NOT EXISTS idx_meter_readings_billing_period_id ON meter_readings(billing_period_id)",
            "CREATE INDEX IF NOT EXISTS idx_meter_readings_kpspams_id ON meter_readings(kpspams_id)",

            // Financial Transactions
            "CREATE INDEX IF NOT EXISTS idx_financial_transactions_kpspams_id ON financial_transactions(kpspams_id)",
            "CREATE INDEX IF NOT EXISTS idx_financial_transactions_cash_account_id ON financial_transactions(cash_account_id)",
            "CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type)",
            "CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category)",

            // Cash Accounts
            "CREATE INDEX IF NOT EXISTS idx_cash_accounts_kpspams_id ON cash_accounts(kpspams_id)",
            "CREATE INDEX IF NOT EXISTS idx_cash_accounts_is_active ON cash_accounts(is_active)",

            // Users
            "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            "CREATE INDEX IF NOT EXISTS idx_users_kpspams_id ON users(kpspams_id)",

            // Functional int indexes
            "CREATE INDEX IF NOT EXISTS idx_connections_cust_id_int ON connections((NULLIF(customer_id, '')::integer))",
            "CREATE INDEX IF NOT EXISTS idx_customers_kpspams_id_int ON customers((NULLIF(kpspams_id, '')::integer))",
            "CREATE INDEX IF NOT EXISTS idx_invoices_kpspams_id_int ON invoices((NULLIF(kpspams_id, '')::integer))",
            "CREATE INDEX IF NOT EXISTS idx_cash_accounts_kpspams_id_int ON cash_accounts((NULLIF(kpspams_id, '')::integer))",
            "CREATE INDEX IF NOT EXISTS idx_complaints_kpspams_id_int ON complaints((NULLIF(kpspams_id, '')::integer))",
        ];

        foreach ($indexes as $sql) {
            try {
                DB::statement($sql);
            } catch (\Throwable $e) {
                // Ignore if already exists
            }
        }
    }

    public function down(): void
    {
        // Safe no-op or drop indexes
    }
};
