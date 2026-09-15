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
        Schema::create('pertumbuhan_anak', function (Blueprint $table) {
            $table->id();
            $table->foreignId('anak_id')->constrained('children')->onDelete('cascade');
            $table->date('tanggal');
            $table->decimal('berat_kg', 5, 2);
            $table->decimal('tinggi_cm', 5, 2);
            $table->decimal('lingkar_kepala_cm', 5, 2)->nullable();
            $table->timestamps();

            $table->index(['anak_id', 'tanggal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pertumbuhan_anak');
    }
};
