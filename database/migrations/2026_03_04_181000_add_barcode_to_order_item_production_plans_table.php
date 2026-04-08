<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Backward-compatible migration: barcode column is now defined
        // in create_order_item_production_plans_table.
        // Keep only backfill logic for environments where column exists.
        if (Schema::hasColumn('order_item_production_plans', 'barcode')) {
            $rows = DB::table('order_item_production_plans')
                ->select('id', 'barcode')
                ->orderBy('id')
                ->get();

            foreach ($rows as $row) {
                if (!empty($row->barcode)) {
                    continue;
                }

                $prefix = '9200';
                $barcode = $prefix . str_pad((string) $row->id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
                DB::table('order_item_production_plans')
                    ->where('id', $row->id)
                    ->update(['barcode' => $barcode]);
            }
        }
    }

    public function down(): void
    {
        // no-op: barcode belongs to the base table migration
    }
};
