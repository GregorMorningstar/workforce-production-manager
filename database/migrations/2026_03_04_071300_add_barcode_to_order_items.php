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
        if (!Schema::hasColumn('order_items', 'barcode')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->string('barcode')->nullable()->after('id');
            });
        }

        // Populate barcode for existing rows using same logic as model
        $prefix = '9100';
        $items = DB::table('order_items')->get();
        foreach ($items as $item) {
            $id = $item->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            DB::table('order_items')->where('id', $id)->update(['barcode' => $barcode]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('order_items', 'barcode')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropColumn('barcode');
            });
        }
    }
};
