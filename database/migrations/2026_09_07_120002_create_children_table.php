<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('children', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('avatar', 255)->nullable();
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['male', 'female', 'unspecified'])->default('unspecified');
            $table->enum('age_level', ['4-5', '6-7', '8'])->default('6-7')->comment('menentukan tingkat kesulitan default');
            $table->unsignedInteger('total_stars')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('children');
    }
};
