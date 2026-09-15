<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('child_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->onDelete('cascade');
            $table->foreignId('badge_id')->constrained('badges')->onDelete('cascade');
            $table->timestamp('earned_at')->nullable();
            $table->timestamps();

            $table->unique(['child_id', 'badge_id'], 'uq_child_badge');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('child_badges');
    }
};
