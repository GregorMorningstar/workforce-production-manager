<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\ApplicationStatus;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('school_certificates', function (Blueprint $table) {
            if (!Schema::hasColumn('school_certificates', 'certificate_path')) {
                $table->string('certificate_path')->nullable()->after('field_of_study');
            }
            if (!Schema::hasColumn('school_certificates', 'status')) {
                $table->string('status')->default(ApplicationStatus::PENDING->value)->after('certificate_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_certificates', function (Blueprint $table) {
            if (Schema::hasColumn('school_certificates', 'certificate_path')) {
                $table->dropColumn('certificate_path');
            }
            if (Schema::hasColumn('school_certificates', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
