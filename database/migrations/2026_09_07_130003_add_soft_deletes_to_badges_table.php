<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('badges', function (Blueprint $table) {
            if (! Schema::hasColumn('badges', 'deleted_at')) {
                $table->softDeletes()->after('criteria_value');
            }
        });
    }

    public function down(): void
    {
        Schema::table('badges', function (Blueprint $table) {
            if (Schema::hasColumn('badges', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
