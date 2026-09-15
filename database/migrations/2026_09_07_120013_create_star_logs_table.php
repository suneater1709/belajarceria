<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('star_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->onDelete('cascade');
            $table->enum('source_type', ['quiz_attempt', 'daily_login', 'bonus'])->default('quiz_attempt');
            $table->unsignedBigInteger('source_id')->nullable()->comment('mis. id quiz_attempts jika source_type=quiz_attempt');
            $table->integer('stars');
            $table->timestamp('created_at')->nullable();

            $table->index(['child_id', 'created_at'], 'idx_star_logs_child');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('star_logs');
    }
};
