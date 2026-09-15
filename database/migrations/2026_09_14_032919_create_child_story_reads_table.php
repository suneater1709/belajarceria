<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('child_story_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->onDelete('cascade');
            $table->foreignId('story_id')->constrained('stories')->onDelete('cascade');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['child_id', 'story_id'], 'uq_child_story');
            $table->index('child_id', 'idx_story_reads_child');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('child_story_reads');
    }
};
