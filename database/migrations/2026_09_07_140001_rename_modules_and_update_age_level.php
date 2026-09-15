<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Rename 3 Modul sesuai Poin 4
        DB::table('modules')->where('code', 'ips')->update([
            'name' => 'Social Explore',
            'description' => 'Mengenal lingkungan keluarga, tetangga, arah mata angin, dan budaya nusantara.',
        ]);

        DB::table('modules')->where('code', 'ipa')->update([
            'name' => 'Kognitif Area',
            'description' => 'Eksplorasi alam: panca indera, hewan, tumbuhan, dan rahasia sains di sekitar kita.',
        ]);

        DB::table('modules')->where('code', 'matematika')->update([
            'name' => 'Math for Fun',
            'description' => 'Bermain logika angka, berhitung seru, penjumlahan, pengurangan, dan pengenalan pola geometri.',
        ]);

        // 2. Modifikasi kolom age_level pada tabel children agar mendukung rentang 3-6 tahun (Poin 5)
        DB::statement("ALTER TABLE children MODIFY COLUMN age_level VARCHAR(20) NOT NULL DEFAULT '3-4'");
    }

    public function down(): void
    {
        DB::table('modules')->where('code', 'ips')->update(['name' => 'Ilmu Pengetahuan Sosial']);
        DB::table('modules')->where('code', 'ipa')->update(['name' => 'Ilmu Pengetahuan Alam']);
        DB::table('modules')->where('code', 'matematika')->update(['name' => 'Math Fun Quest']);

        DB::statement("ALTER TABLE children MODIFY COLUMN age_level VARCHAR(20) NOT NULL DEFAULT '6-7'");
    }
};
