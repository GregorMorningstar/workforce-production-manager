<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\UserRole;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->enum('role', array_map(fn ($r) => $r->value, UserRole::cases()))
                  ->default(UserRole::EMPLOYEE->value)
                  ->index();

            // EAN-13 barcode (string length 13)
            $table->string('barcode', 13)->unique()->nullable();
            $table->unsignedBigInteger('department_id')->nullable()->index();
            $table->unsignedBigInteger('machine_id')->nullable()->index();
            $table->boolean('is_complited_education')->default(false);
            $table->boolean('is_complited_work_time')->default(false);
            $table->boolean('is_complited_address')->default(false);
            $table->integer('monthly_work_time_target')->default(0);
            $table->integer('monthly_education_time_target')->default(0);
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // previously a pivot `department_user` was created here for many-to-many
        // relationship. Current app design uses one-department-per-user (1:N),
        // so we keep `department_id` column on `users` and do not create a pivot.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_user');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
