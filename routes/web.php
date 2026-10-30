<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

// Route untuk menjalankan seeder bank soal langsung lewat browser di server (cPanel)
Route::get('/seed-bank-soal-ceria', function () {
    try {
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\PdfBankSoalSeeder',
            '--force' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Seeding bank soal berhasil dijalankan di server!',
            'output' => Artisan::output(),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
});

// Seluruh rute non-API dilayani oleh view app (React SPA)
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|seed-bank-soal-ceria).*$');

