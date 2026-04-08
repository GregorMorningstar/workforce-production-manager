<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use App\Models\Machines;
use App\Models\User;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'barcode',
        'location',
        'description',
        'count_of_machine',
        'count_of_employee',
        'count_of_failure_machine',
        'oee_coefficient',
        'hall_layout',
        'created_by',
    ];

    protected $casts = [
        'hall_layout' => 'array',
    ];

    /**
     * Append convenience attributes for front-end naming consistency.
     * The UI expects plural attribute names like `count_of_machines`,
     * `count_of_employees`, `count_of_failures` so we provide accessors
     * that map to the existing DB columns.
     */
    protected $appends = [
        'count_of_machines',
        'count_of_employees',
        'count_of_failures',
    ];

    public function getCountOfMachinesAttribute(): int
    {
        return (int) ($this->attributes['count_of_machine'] ?? 0);
    }

    public function getCountOfEmployeesAttribute(): int
    {
        return (int) ($this->attributes['count_of_employee'] ?? 0);
    }

    public function getCountOfFailuresAttribute(): int
    {
        return (int) ($this->attributes['count_of_failure_machine'] ?? 0);
    }
    public function geoee_coefficientAttribute(): float
    {
        return (float) ($this->attributes['oee_coefficient'] ?? 0);
    }


    protected static function booted()
    {
        static::created(function ($department) {
            $prefix = '2000';
            $id = $department->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($department->barcode !== $barcode) {
                $department->barcode = $barcode;
                $department->save();
            }
        });
    }

    // jeden departament ma wiele maszyn (1:N)
    public function machines(): HasMany
    {
        return $this->hasMany(Machines::class, 'department_id');
    }

    // jeden departament ma wielu użytkowników (1:N)
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'department_id');
    }
    public function machineFailures(): HasManyThrough
    {
        return $this->hasManyThrough(
            MachineFailure::class,
            Machines::class,
            'department_id',
            'machine_id',
            'id',
            'id'
        );
    }

}
