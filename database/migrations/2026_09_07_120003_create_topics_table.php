<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('icon', 255)->nullable();
            $table->enum('difficulty', ['mudah', 'sedang', 'sulit'])->default('mudah');
            $table->enum('min_age_level', ['4-5', '6-7', '8'])->default('4-5');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['module_id', 'sort_order'], 'idx_topics_module');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topics');
    }
};
