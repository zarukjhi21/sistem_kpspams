<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_periods', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('kpspams_id');
            $table->string('period_code', 20);
            $table->string('name', 50);
            $table->integer('year');
            $table->integer('month');
            $table->date('reading_start_date');
            $table->date('reading_end_date');
            $table->date('billing_date');
            $table->date('due_date');
            $table->string('status', 20)->default('OPEN'); // 'OPEN', 'READING', 'INVOICED', 'CLOSED'
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->unique(['kpspams_id', 'year', 'month'], 'uq_kpspams_period');
            $table->index('kpspams_id', 'idx_billing_periods_kpspams');
        });

        Schema::create('meter_readings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedInteger('billing_period_id');
            $table->unsignedBigInteger('connection_id');
            $table->unsignedBigInteger('meter_id');
            $table->unsignedBigInteger('reader_user_id')->nullable();
            $table->date('reading_date')->default(DB::raw('CURRENT_DATE'));
            $table->decimal('previous_reading', 10, 2);
            $table->decimal('current_reading', 10, 2);
            $table->decimal('usage_m3', 10, 2);
            $table->string('meter_photo_path', 255);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('status', 20)->default('PENDING'); // 'PENDING', 'VERIFIED', 'ANOMALY_ROLLBACK', 'ANOMALY_SPIKE', 'REJECTED'
            $table->text('anomaly_reason')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('billing_period_id')->references('id')->on('billing_periods')->onDelete('restrict');
            $table->foreign('connection_id')->references('id')->on('connections')->onDelete('restrict');
            $table->foreign('meter_id')->references('id')->on('meters')->onDelete('restrict');
            $table->foreign('reader_user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');

            $table->unique(['billing_period_id', 'connection_id'], 'uq_period_connection_reading');
            $table->index('kpspams_id', 'idx_meter_readings_kpspams');
            $table->index('connection_id', 'idx_meter_readings_connection');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meter_readings');
        Schema::dropIfExists('billing_periods');
    }
};
