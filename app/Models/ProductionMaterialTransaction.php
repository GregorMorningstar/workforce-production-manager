<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionMaterialTransaction extends Model
{
    protected $fillable = [
        'production_material_id',
        'type',
        'quantity',
        'quantity_before',
        'quantity_after',
        'barcode',
        'delivery_number',
        'delivery_scan',
        'reason',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'quantity_before' => 'decimal:2',
        'quantity_after' => 'decimal:2',
    ];

    public function productionMaterial(): BelongsTo
    {
        return $this->belongsTo(ProductionMaterial::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted()
    {
        static::created(function ($transaction) {
            if (!$transaction->barcode) {
                try {
                    $prefix = '3060';
                    $idStr = (string) $transaction->id;
                    $barcode = $prefix . str_pad($idStr, 13 - strlen($prefix), '0', STR_PAD_LEFT);
                    $transaction->updateQuietly(['barcode' => $barcode]);
                } catch (\Throwable $e) {
                    // best-effort only
                }
            }
        });
    }
}

 