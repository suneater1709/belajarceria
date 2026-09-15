<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->foreignId('topic_id')->nullable()->constrained('topics')->onDelete('set null')->comment('opsional, jika cerita dikelompokkan per topik');
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('video_url', 255)->nullable();
            $table->string('pdf_url', 255)->nullable();
            $table->string('cover_image_url', 255)->nullable();
            $table->enum('level', ['mudah', 'sedang', 'sulit'])->default('mudah');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stories');
    }
};
