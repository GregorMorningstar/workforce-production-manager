<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Machines;
use App\Models\User;
use App\Models\ProductionMaterial;

class Operationmachine extends Model
{
    use HasFactory;

    protected $fillable = [
        'barcode',
        'machine_id',
        'production_material_id',
        'operation_name',
        'description',
        'changeover_time',
    ];

    protected static function booted()
    {
        static::created(function ($operationMachine) {
            if (!$operationMachine->barcode) {
                $prefix = '3100';
                $idStr = (string) $operationMachine->id;
                $barcode = $prefix . str_pad($idStr, 13 - strlen($prefix), '0', STR_PAD_LEFT);
                $operationMachine->updateQuietly(['barcode' => $barcode]);
            }
        });
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machines::class, 'machine_id');
    }

    /**
     * Primary material referenced by this operation (optional).
     */
    public function productionMaterial(): BelongsTo
    {
        return $this->belongsTo(ProductionMaterial::class, 'production_material_id');
    }

    /**
     * Materials used by this operation on the machine.
     */
    public function materials(): BelongsToMany
    {
        return $this->belongsToMany(ProductionMaterial::class, 'material_operation_machine', 'operationmachine_id', 'production_material_id')
            ->withPivot(['quantity', 'unit'])
            ->withTimestamps();
    }
}
