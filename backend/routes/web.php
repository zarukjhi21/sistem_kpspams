<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'SI-KPSPAMS KUAJANG API Engine',
        'status' => 'operational',
        'version' => '1.0.0',
    ]);
});
