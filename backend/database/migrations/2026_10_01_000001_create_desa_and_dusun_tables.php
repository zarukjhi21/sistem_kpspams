<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desa', function (Blueprint $table) {
            $table->increments('id');
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->string('subdistrict', 100);
            $table->string('district', 100);
            $table->string('province', 100);
            $table->string('postal_code', 10)->nullable();
            $table->text('office_address')->nullable();
            $table->string('head_of_village', 100)->nullable();
            $table->string('phone', 25)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('logo_path', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('dusun', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('desa_id');
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('desa_id')->references('id')->on('desa')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dusun');
        Schema::dropIfExists('desa');
    }
};
