<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('topic_id')->constrained('topics')->onDelete('cascade');
            $table->enum('type', [
                'multiple_choice',
                'true_false',
                'matching',
                'listen_choose',
                'arrange_word',
                'drag_drop',
            ])->default('multiple_choice');
            $table->text('question_text');
            $table->string('question_image_url', 255)->nullable();
            $table->string('question_audio_url', 255)->nullable()->comment('narasi/voice-over soal');
            $table->unsignedInteger('points')->default(10);
            $table->enum('difficulty', ['mudah', 'sedang', 'sulit'])->default('mudah');
            $table->text('explanation')->nullable()->comment('penjelasan singkat setelah dijawab (opsional)');
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null')->comment('FK ke users pembuat soal');
            $table->softDeletes();
            $table->timestamps();

            $table->index(['topic_id', 'status'], 'idx_questions_topic_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
