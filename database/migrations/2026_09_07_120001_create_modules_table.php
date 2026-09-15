<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('cerita | bahasa-arab | bahasa-indonesia | bahasa-inggris | ipa | ips | matematika');
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('icon', 255)->nullable();
            $table->string('color_theme', 20)->nullable()->comment('hex warna aksen modul, mis. #6366F1');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
