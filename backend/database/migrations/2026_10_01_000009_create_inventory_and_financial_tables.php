<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->string('code', 50);
            $table->string('name', 150);
            $table->string('category', 50); // 'PIPA', 'VALVE', 'FITTING', 'METER', 'LEM_SEAL'
            $table->string('unit', 20); // 'Batang', 'Pcs', 'Roll', 'Kaleng'
            $table->integer('min_stock')->default(5);
            $table->integer('current_stock')->default(0);
            $table->decimal('unit_price', 14, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->unique(['kpspams_id', 'code'], 'uq_kpspams_inv_code');
            $table->index('kpspams_id', 'idx_inventory_kpspams');
        });

        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedBigInteger('inventory_item_id');
            $table->string('transaction_type', 20); // 'IN_PURCHASE', 'OUT_WORK_ORDER', 'ADJUSTMENT', 'TRANSFER'
            $table->string('reference_type', 50)->nullable(); // 'WORK_ORDER', 'PURCHASE_INVOICE', 'MANUAL_OPNAME'
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->integer('quantity');
            $table->integer('stock_before');
            $table->integer('stock_after');
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('inventory_item_id')->references('id')->on('inventory_items')->onDelete('restrict');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
            $table->index('inventory_item_id', 'idx_inv_trx_item');
        });

        Schema::create('work_order_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('work_order_id');
            $table->unsignedBigInteger('inventory_item_id');
            $table->integer('quantity_used');
            $table->decimal('unit_cost', 14, 2);
            $table->decimal('total_cost', 14, 2);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('work_order_id')->references('id')->on('work_orders')->onDelete('cascade');
            $table->foreign('inventory_item_id')->references('id')->on('inventory_items')->onDelete('restrict');
        });

        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedInteger('cash_account_id');
            $table->string('transaction_number', 50)->unique();
            $table->date('transaction_date');
            $table->string('transaction_type', 20); // 'INCOME', 'EXPENSE', 'TRANSFER'
            $table->string('category', 50); // 'AIR_PAYMENT', 'SAMBUNGAN_BARU', 'OPERASIONAL_PLN', 'GAJI_PETUGAS', 'BAHAN_KIMIA', 'PEMELIHARAAN'
            $table->decimal('amount', 14, 2);
            $table->string('reference_type', 50)->nullable(); // 'PAYMENT', 'WORK_ORDER', 'MANUAL'
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('description');
            $table->string('receipt_attachment_path', 255)->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('cash_account_id')->references('id')->on('cash_accounts')->onDelete('restrict');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');

            $table->index('kpspams_id', 'idx_fin_trx_kpspams');
            $table->index('cash_account_id', 'idx_fin_trx_account');
            $table->index('transaction_date', 'idx_fin_trx_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');
        Schema::dropIfExists('work_order_items');
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('inventory_items');
    }
};
