<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->index(['kpspams_id', 'payment_date'], 'idx_payments_kpspams_date');
            $table->index(['customer_id', 'payment_date'], 'idx_payments_customer_date');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['kpspams_id', 'due_date'], 'idx_invoices_kpspams_due_date');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_kpspams_date');
            $table->dropIndex('idx_payments_customer_date');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_invoices_kpspams_due_date');
        });
    }
};
