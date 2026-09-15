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
        Schema::create('milestone_anak', function (Blueprint $table) {
            $table->id();
            $table->foreignId('anak_id')->constrained('children')->onDelete('cascade');
            $table->string('milestone_key', 100);
            $table->boolean('tercapai')->default(false);
            $table->date('tanggal_tercapai')->nullable();
            $table->timestamps();

            $table->unique(['anak_id', 'milestone_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('milestone_anak');
    }
};
