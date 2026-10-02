<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tariffs', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedInteger('customer_type_id');
            $table->string('name', 100);
            $table->date('effective_from');
            $table->date('effective_until')->nullable();
            $table->string('status', 20)->default('ACTIVE'); // 'ACTIVE', 'INACTIVE', 'SUPERSEDED'
            $table->decimal('fixed_admin_fee', 14, 2)->default(0.00);
            $table->decimal('maintenance_fee', 14, 2)->default(0.00);
            $table->decimal('late_penalty_fee', 14, 2)->default(0.00); // Default Rp0 untuk MVP
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('customer_type_id')->references('id')->on('customer_types')->onDelete('restrict');
            $table->index(['kpspams_id', 'customer_type_id', 'effective_from'], 'idx_tariffs_lookup');
        });

        Schema::create('tariff_components', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('tariff_id');
            $table->integer('tier_order')->default(1);
            $table->integer('tier_min_m3')->default(0);
            $table->integer('tier_max_m3')->nullable(); // NULL untuk tier tertinggi / tak terhingga
            $table->decimal('rate_per_m3', 14, 2);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('tariff_id')->references('id')->on('tariffs')->onDelete('cascade');
        });

        Schema::create('kpspams_billing_policies', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('kpspams_id')->unique();
            $table->integer('due_day_of_month')->default(20);
            $table->string('late_penalty_type', 20)->default('NONE'); // 'NONE', 'FLAT', 'PERCENTAGE'
            $table->decimal('late_penalty_amount', 14, 2)->default(0.00); // Default Rp0 untuk MVP
            $table->integer('sp1_arrears_months')->default(1);
            $table->integer('sp2_arrears_months')->default(2);
            $table->integer('disconnect_recommendation_months')->default(3);
            $table->decimal('reconnect_fee', 14, 2)->default(0.00);
            $table->boolean('is_auto_disconnect')->default(false); // Selalu FALSE (hanya rekomendasi administratif)
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpspams_billing_policies');
        Schema::dropIfExists('tariff_components');
        Schema::dropIfExists('tariffs');
    }
};
