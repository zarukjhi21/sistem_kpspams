<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpspams', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('desa_id');
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->string('decree_number', 100)->nullable();
            $table->date('established_date')->nullable();
            $table->text('office_address')->nullable();
            $table->string('contact_phone', 25)->nullable();
            $table->string('contact_email', 100)->nullable();
            $table->text('bank_account_info')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('desa_id')->references('id')->on('desa')->onDelete('restrict');
        });

        Schema::create('kpspams_dusun', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedInteger('dusun_id');
            $table->date('assigned_date')->default(DB::raw('CURRENT_DATE'));
            $table->boolean('is_primary')->default(true);
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('cascade');
            $table->foreign('dusun_id')->references('id')->on('dusun')->onDelete('restrict');
            $table->unique(['kpspams_id', 'dusun_id'], 'uq_kpspams_dusun');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpspams_dusun');
        Schema::dropIfExists('kpspams');
    }
};
