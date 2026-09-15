<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('icon', 255)->nullable();
            $table->enum('criteria_type', ['module_complete', 'topic_streak', 'perfect_score', 'total_stars']);
            $table->unsignedInteger('criteria_value')->default(0)->comment('nilai ambang, mis. total_stars >= 50');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('badges');
    }
};
