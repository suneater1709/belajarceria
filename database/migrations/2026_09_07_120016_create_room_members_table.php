<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('rooms')->onDelete('cascade');
            $table->foreignId('child_id')->constrained('children')->onDelete('cascade');
            $table->timestamp('joined_at')->nullable();

            $table->unique(['room_id', 'child_id'], 'uq_room_child');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_members');
    }
};
