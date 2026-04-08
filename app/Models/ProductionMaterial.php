<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'barcode',
        'group_material',
        'material_form',
        'stock_empty_alarm',
        'available_quantity',
        'delivery_number',
        'delivery_scan',
    ];

    /**
     * Operations on machines that use this material.
     */
    public function operations(): BelongsToMany
    {
        return $this->belongsToMany(Operationmachine::class, 'material_operation_machine', 'production_material_id', 'operationmachine_id')
            ->withPivot(['quantity', 'unit'])
            ->withTimestamps();
    }

    /**
     * Transactions for this material.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(ProductionMaterialTransaction::class);
    }

    protected static function booted()
    {
        static::created(function ($productionMaterial) {
            if (!$productionMaterial->barcode) {
                $prefix = '3050';
                $idStr = (string) $productionMaterial->id;
                $barcode = $prefix . str_pad($idStr, 13 - strlen($prefix), '0', STR_PAD_LEFT);
                $productionMaterial->updateQuietly(['barcode' => $barcode]);
            }
        });
    }

}
