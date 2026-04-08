<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductionSchemaStep extends Model
{
    use HasFactory;

    protected $table = 'production_schema_steps';

    protected $fillable = [
        'production_schema_id',
        'step_number',
        'barcode',
        'operationmachine_id',
        'machine_id',
        'production_material_id',
        'required_quantity',
        'unit',
        'production_time_seconds',
        'stock_empty_alarm',
        'notes',
    ];

 protected static function booted()
    {
        static::created(function ($productionSchemaStep) {
            $prefix = '8900';
            $id = $productionSchemaStep->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($productionSchemaStep->barcode !== $barcode) {
                $productionSchemaStep->barcode = $barcode;
                $productionSchemaStep->save();
            }
        });
    }

    public function schema()
    {
        return $this->belongsTo(ProductionSchema::class, 'production_schema_id');
    }

    public function operation()
    {
        return $this->belongsTo(Operationmachine::class, 'operationmachine_id');
    }

    public function machine()
    {
        return $this->belongsTo(Machines::class, 'machine_id');
    }

    public function material()
    {
        return $this->belongsTo(ProductionMaterial::class, 'production_material_id');
    }
}
