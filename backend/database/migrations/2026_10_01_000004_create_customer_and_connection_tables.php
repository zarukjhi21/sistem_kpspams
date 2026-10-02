<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_types', function (Blueprint $table) {
            $table->increments('id');
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedInteger('customer_type_id');
            $table->string('code', 30)->unique();
            $table->string('nik', 20);
            $table->string('no_kk', 20)->nullable();
            $table->string('full_name', 150);
            $table->string('phone', 25);
            $table->string('email', 100)->nullable();
            $table->text('identity_address');
            $table->string('status', 20)->default('ACTIVE'); // 'ACTIVE', 'INACTIVE', 'SUSPENDED'
            $table->date('registration_date')->default(DB::raw('CURRENT_DATE'));
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('customer_type_id')->references('id')->on('customer_types')->onDelete('restrict');
            $table->index('kpspams_id', 'idx_customers_kpspams');
            $table->index('nik', 'idx_customers_nik');
        });

        // Add foreign key from users to customers
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
        });

        Schema::create('meters', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->string('serial_number', 50);
            $table->string('brand', 50);
            $table->string('diameter_inch', 10)->default('1/2');
            $table->decimal('initial_reading', 10, 2)->default(0.00);
            $table->date('installation_date')->nullable();
            $table->string('condition', 20)->default('GOOD'); // 'GOOD', 'FAULTY', 'BLURRED', 'BROKEN'
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->unique(['kpspams_id', 'serial_number'], 'uq_kpspams_meter_serial');
            $table->index('kpspams_id', 'idx_meters_kpspams');
        });

        Schema::create('connections', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('kpspams_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedInteger('dusun_id');
            $table->unsignedBigInteger('meter_id')->nullable()->unique();
            $table->string('connection_no', 50)->unique();
            $table->text('address_detail');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('status', 20)->default('ACTIVE'); // 'ACTIVE', 'SEALED', 'DISCONNECTED', 'TERMINATED'
            $table->date('installed_date')->default(DB::raw('CURRENT_DATE'));
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('kpspams_id')->references('id')->on('kpspams')->onDelete('restrict');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('dusun_id')->references('id')->on('dusun')->onDelete('restrict');
            $table->foreign('meter_id')->references('id')->on('meters')->onDelete('set null');

            $table->index('kpspams_id', 'idx_connections_kpspams');
            $table->index('customer_id', 'idx_connections_customer');
            $table->index('dusun_id', 'idx_connections_dusun');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connections');
        Schema::dropIfExists('meters');
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
        });
        Schema::dropIfExists('customers');
        Schema::dropIfExists('customer_types');
    }
};
