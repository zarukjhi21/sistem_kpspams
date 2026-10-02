<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_reversals', function (Blueprint $table) {
            $table->unsignedBigInteger('approved_by')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('payment_reversals', function (Blueprint $table) {
            $table->unsignedBigInteger('approved_by')->nullable(false)->change();
        });
    }
};
