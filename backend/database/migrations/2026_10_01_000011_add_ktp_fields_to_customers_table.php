<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('birth_place_date', 100)->nullable()->after('full_name');
            $table->string('gender', 20)->nullable()->after('birth_place_date');
            $table->string('rt_rw', 20)->nullable()->after('identity_address');
            $table->string('dusun', 100)->nullable()->after('rt_rw');
            $table->string('village', 100)->default('KUAJANG')->after('dusun');
            $table->string('district', 100)->default('BINUANG')->after('village');
            $table->string('religion', 30)->nullable()->after('district');
            $table->string('marital_status', 50)->nullable()->after('religion');
            $table->string('occupation', 100)->nullable()->after('marital_status');
            $table->string('ktp_photo_path', 255)->nullable()->after('occupation');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'birth_place_date',
                'gender',
                'rt_rw',
                'dusun',
                'village',
                'district',
                'religion',
                'marital_status',
                'occupation',
                'ktp_photo_path',
            ]);
        });
    }
};
