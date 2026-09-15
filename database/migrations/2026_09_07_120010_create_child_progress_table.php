<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('child_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->onDelete('cascade');
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->foreignId('topic_id')->constrained('topics')->onDelete('cascade');
            $table->enum('status', ['locked', 'unlocked', 'in_progress', 'completed'])->default('locked');
            $table->unsignedInteger('best_score')->default(0);
            $table->unsignedTinyInteger('stars_earned')->default(0);
            $table->timestamp('last_accessed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['child_id', 'topic_id'], 'uq_child_topic');
            $table->index(['child_id', 'module_id'], 'idx_progress_child_module');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('child_progress');
    }
};
