<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('machines', function (Blueprint $table) {
            if (!Schema::hasColumn('machines', 'last_operationmachine_id')) {
                $table->foreignId('last_operationmachine_id')
                    ->nullable()
                    ->after('department_id')
                    ->constrained('operationmachines')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('machines', 'last_items_finished_good_id')) {
                $table->foreignId('last_items_finished_good_id')
                    ->nullable()
                    ->after('last_operationmachine_id')
                    ->constrained('items_finished_goods')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('machines', function (Blueprint $table) {
            if (Schema::hasColumn('machines', 'last_items_finished_good_id')) {
                $table->dropConstrainedForeignId('last_items_finished_good_id');
            }

            if (Schema::hasColumn('machines', 'last_operationmachine_id')) {
                $table->dropConstrainedForeignId('last_operationmachine_id');
            }
        });
    }
};
