<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('connection_id')->nullable();
            $table->string('ticket_number', 50)->unique();
            $table->string('category', 50); // 'AIR_MATI', 'TEKANAN_RENDAH', 'PIPA_BOCOR', 'METER_RUSAK', 'TAGIHAN_ANOMALI', 'KUALITAS_AIR'
            $table->text('description');
            $table->string('photo_path', 255)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('priority', 20)->default('MEDIUM'); // 'LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'
            $table->string('status', 20)->default('RECEIVED'); // 'RECEIVED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'
            $table->text('rejection_reason')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('connection_id')->references('id')->on('connections')->onDelete('set null');

            $table->index('kpspams_id', 'idx_complaints_kpspams');
            $table->index('status', 'idx_complaints_status');
        });

        Schema::create('work_orders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedBigInteger('complaint_id')->nullable();
            $table->string('wo_number', 50)->unique();
            $table->unsignedBigInteger('assigned_to_user_id');
            $table->date('scheduled_date');
            $table->timestamp('start_time')->nullable();
            $table->timestamp('completion_time')->nullable();
            $table->string('status', 20)->default('PENDING'); // 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
            $table->string('before_photo_path', 255)->nullable();
            $table->string('after_photo_path', 255)->nullable();
            $table->text('action_taken')->nullable();
            $table->decimal('labor_cost', 14, 2)->default(0.00);
            $table->decimal('material_cost', 14, 2)->default(0.00);
            $table->decimal('total_cost', 14, 2)->default(0.00);
            $table->text('supervisor_notes')->nullable();
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('complaint_id')->references('id')->on('complaints')->onDelete('set null');
            $table->foreign('assigned_to_user_id')->references('id')->on('users')->onDelete('restrict');

            $table->index('kpspams_id', 'idx_work_orders_kpspams');
            $table->index('status', 'idx_work_orders_status');
        });

        Schema::create('asset_categories', function (Blueprint $table) {
            $table->increments('id');
            $table->string('code', 30)->unique();
            $table->string('name', 100);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('assets', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedInteger('category_id');
            $table->string('asset_code', 50)->unique();
            $table->string('name', 150);
            $table->text('location_description');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('acquisition_year');
            $table->string('funding_source', 100)->nullable();
            $table->decimal('purchase_value', 14, 2)->default(0.00);
            $table->string('condition', 20)->default('GOOD'); // 'GOOD', 'LIGHT_DAMAGE', 'HEAVY_DAMAGE'
            $table->string('status', 20)->default('OPERATIONAL'); // 'OPERATIONAL', 'STANDBY', 'MAINTENANCE', 'DECOMMISSIONED'
            $table->string('photo_path', 255)->nullable();
            $table->string('person_in_charge', 100)->nullable();
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('category_id')->references('id')->on('asset_categories')->onDelete('restrict');
            $table->index('kpspams_id', 'idx_assets_kpspams');
        });

        Schema::create('maintenance_records', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedBigInteger('asset_id');
            $table->unsignedBigInteger('work_order_id')->nullable();
            $table->string('record_number', 50)->unique();
            $table->string('maintenance_type', 30); // 'PREVENTIVE', 'CORRECTIVE', 'OVERHAUL'
            $table->date('performed_date');
            $table->string('performed_by', 150);
            $table->text('description');
            $table->decimal('cost', 14, 2)->default(0.00);
            $table->date('next_maintenance_date')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('asset_id')->references('id')->on('assets')->onDelete('restrict');
            $table->foreign('work_order_id')->references('id')->on('work_orders')->onDelete('set null');
            $table->index('kpspams_id', 'idx_maintenance_kpspams');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_records');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('asset_categories');
        Schema::dropIfExists('work_orders');
        Schema::dropIfExists('complaints');
    }
};
