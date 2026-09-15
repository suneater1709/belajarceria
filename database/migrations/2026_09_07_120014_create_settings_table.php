<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->unique()->constrained('children')->onDelete('cascade');
            $table->boolean('sound_effects_enabled')->default(true);
            $table->boolean('background_music_enabled')->default(true);
            $table->boolean('voice_narration_enabled')->default(true);
            $table->unsignedInteger('daily_time_limit_minutes')->nullable()->comment('batas waktu layar harian, opsional');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
