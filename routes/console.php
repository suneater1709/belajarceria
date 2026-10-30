<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('banksoal:seed', function () {
    $this->info('Memulai seeding 360 bank soal dari PDF...');
    require_once database_path('seeders/PdfBankSoalSeeder.php');
    $seeder = new \Database\Seeders\PdfBankSoalSeeder();
    $seeder->setCommand($this);
    $seeder->run();
})->purpose('Seed bank soal dari PDF (tanpa butuh composer dump-autoload)');

