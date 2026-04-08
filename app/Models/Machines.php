<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Operationmachine;
use App\Models\User;

class Machines extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'model',
        'serial_number',
        'barcode',
        'year_of_production',
        'description',
        'status',
        'image_path',
        'last_failure_date',
        'user_id',
        'department_id',
        'last_operationmachine_id',
        'last_items_finished_good_id',
    ];


protected static function booted()
    {
        static::created(function ($machine) {
            $prefix = '3000';
            $id = $machine->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($machine->barcode !== $barcode) {
                $machine->barcode = $barcode;
                $machine->save();
            }
        });
    }

    // maszyna należy do jednego departamentu (1:N)
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The user that operates the machine.
     */
    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    // many-to-many: wiele użytkowników może być przypisanych do maszyny (pivot machine_user)
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'machine_user', 'machine_id', 'user_id')->withTimestamps();
    }

    // many-to-many: wiele operacji może być przypisanych do maszyny (pivot machine_operation)
    public function operations(): HasMany
    {
        return $this->hasMany(Operationmachine::class, 'machine_id');
    }

    public function lastOperation(): BelongsTo
    {
        return $this->belongsTo(Operationmachine::class, 'last_operationmachine_id');
    }

    public function lastProduct(): BelongsTo
    {
        return $this->belongsTo(ItemsFinishedGood::class, 'last_items_finished_good_id');
    }

    //relacja z MachineFailure (1:N)
    public function machineFailures(): HasMany
    {
        return $this->hasMany(MachineFailure::class, 'machine_id');
    }


}
