<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Machines;
use App\Models\MachineFailureRepair; // dostosuj nazwę modelu jeśli inna

class MachineFailure extends Model
{


    use \Illuminate\Database\Eloquent\Factories\HasFactory;
    protected $fillable = [
        'machine_id',
        'user_id',
        'department_id',
        'barcode',
        'failure_rank',
        'total_cost',
        'failure_description',
        'reported_at',
        'finished_repaired_at',
    ];


protected static function booted()
    {
        static::created(function ($machineFailure) {
            $prefix = '3200';
            $id = $machineFailure->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($machineFailure->barcode !== $barcode) {
                $machineFailure->barcode = $barcode;
                $machineFailure->save();
            }
        });
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machines::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
    public function repairs(): HasMany
    {
        return $this->hasMany(MachineFailureRepair::class);
    }
}
