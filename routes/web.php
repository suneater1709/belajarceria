<?php

use Illuminate\Support\Facades\Route;

// Seluruh rute non-API dilayani oleh view app (React SPA)
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
