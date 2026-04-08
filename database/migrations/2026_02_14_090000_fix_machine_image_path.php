<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // If any image_path starts with 'storage/', remove that prefix
        DB::table('machines')
            ->where('image_path', 'like', 'storage/%')
            ->update(['image_path' => DB::raw("REPLACE(image_path, 'storage/', '')")]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op safe reverse: prefix back 'storage/' only for rows that don't already have it
        DB::table('machines')
            ->where('image_path', 'not like', 'storage/%')
            ->whereNotNull('image_path')
            ->update(['image_path' => DB::raw("CONCAT('storage/', image_path)")]);
    }
};
