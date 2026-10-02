<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_accounts', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('kpspams_id');
            $table->string('account_code', 30);
            $table->string('account_name', 100);
            $table->string('bank_name', 50)->nullable();
            $table->string('account_number', 50)->nullable();
            $table->decimal('opening_balance', 14, 2)->default(0.00);
            $table->date('opening_balance_date')->default(DB::raw('CURRENT_DATE'));
            $table->text('opening_balance_notes')->nullable();
            $table->decimal('current_balance', 14, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->unique(['kpspams_id', 'account_code'], 'uq_kpspams_account_code');
            $table->index('kpspams_id', 'idx_cash_accounts_kpspams');
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedInteger('billing_period_id');
            $table->unsignedBigInteger('connection_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('meter_reading_id')->unique();
            $table->string('invoice_number', 50)->unique();
            $table->date('invoice_date');
            $table->date('due_date');
            $table->decimal('usage_m3', 10, 2)->default(0.00);
            $table->decimal('water_amount', 14, 2)->default(0.00);
            $table->decimal('admin_fee', 14, 2)->default(0.00);
            $table->decimal('maintenance_fee', 14, 2)->default(0.00);
            $table->decimal('penalty_fee', 14, 2)->default(0.00);
            $table->decimal('total_amount', 14, 2);
            $table->decimal('paid_amount', 14, 2)->default(0.00);
            $table->decimal('balance_due', 14, 2);
            $table->string('status', 20)->default('UNPAID'); // 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'VOIDED'
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('billing_period_id')->references('id')->on('billing_periods')->onDelete('restrict');
            $table->foreign('connection_id')->references('id')->on('connections')->onDelete('restrict');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('meter_reading_id')->references('id')->on('meter_readings')->onDelete('restrict');

            $table->index('kpspams_id', 'idx_invoices_kpspams');
            $table->index('status', 'idx_invoices_status');
            $table->index('connection_id', 'idx_invoices_connection');
            $table->index('customer_id', 'idx_invoices_customer');
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('invoice_id');
            $table->string('item_type', 50); // 'WATER_USAGE_TIER_1', 'ADMIN_FEE', 'MAINTENANCE_FEE', 'LATE_PENALTY'
            $table->string('description', 255);
            $table->decimal('volume', 10, 2)->default(1.00);
            $table->decimal('unit_rate', 14, 2);
            $table->decimal('total_price', 14, 2);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
            $table->index('invoice_id', 'idx_invoice_items_invoice');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedBigInteger('invoice_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedInteger('cash_account_id');
            $table->unsignedBigInteger('received_by_user_id');
            $table->string('receipt_number', 50)->unique();
            $table->timestamp('payment_date')->useCurrent();
            $table->decimal('amount_paid', 14, 2);
            $table->string('payment_method', 30)->default('CASH'); // 'CASH', 'BANK_TRANSFER', 'QRIS'
            $table->string('reference_number', 100)->nullable();
            $table->string('status', 20)->default('SUCCESS'); // 'SUCCESS', 'VOIDED', 'REVERSED'
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('restrict');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('cash_account_id')->references('id')->on('cash_accounts')->onDelete('restrict');
            $table->foreign('received_by_user_id')->references('id')->on('users')->onDelete('restrict');

            $table->index('kpspams_id', 'idx_payments_kpspams');
            $table->index('invoice_id', 'idx_payments_invoice');
        });

        Schema::create('payment_reversals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('payment_id')->unique();
            $table->unsignedInteger('kpspams_id');
            $table->unsignedBigInteger('requested_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->text('reason');
            $table->string('reversal_type', 20)->default('VOID_SAME_DAY'); // 'VOID_SAME_DAY', 'REVERSAL_SUPERVISED'
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('payment_id')->references('id')->on('payments')->onDelete('restrict');
            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_reversals');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('cash_accounts');
    }
};
