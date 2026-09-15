<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->text('cover_image_url')->nullable()->change();
            $table->text('video_url')->nullable()->change();
            $table->text('pdf_url')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->string('cover_image_url', 255)->nullable()->change();
            $table->string('video_url', 255)->nullable()->change();
            $table->string('pdf_url', 255)->nullable()->change();
        });
    }
};
