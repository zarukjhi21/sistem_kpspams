<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('title', 150);
            $table->text('message');
            $table->string('type', 50)->default('SYSTEM'); // 'BILLING', 'WORK_ORDER', 'COMPLAINT', 'SYSTEM'
            $table->json('data_payload')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'is_read'], 'idx_notifications_user');
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedInteger('kpspams_id')->nullable();
            $table->string('action', 50); // 'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VOID', 'REVERSAL', 'TARIFF_CHANGE'
            $table->string('entity', 100); // 'Invoice', 'Payment', 'MeterReading', 'User'
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45);
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('set null');

            $table->index('kpspams_id', 'idx_audit_logs_kpspams');
            $table->index(['entity', 'entity_id'], 'idx_audit_logs_entity');
            $table->index('created_at', 'idx_audit_logs_created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notifications');
    }
};
