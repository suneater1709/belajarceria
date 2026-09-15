<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('children', function (Blueprint $table) {
            if (! Schema::hasColumn('children', 'parent_id')) {
                $table->foreignId('parent_id')
                    ->nullable()
                    ->after('user_id')
                    ->constrained('users')
                    ->onDelete('cascade');
            }
        });

        // Sinkronisasi data yang sudah ada
        DB::statement('UPDATE children SET parent_id = user_id WHERE parent_id IS NULL AND user_id IS NOT NULL');
    }

    public function down(): void
    {
        Schema::table('children', function (Blueprint $table) {
            if (Schema::hasColumn('children', 'parent_id')) {
                $table->dropForeign(['parent_id']);
                $table->dropColumn('parent_id');
            }
        });
    }
};
