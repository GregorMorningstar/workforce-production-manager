<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductionSchema extends Model
{
    use HasFactory;

    protected $table = 'production_schemas';

    protected $fillable = [
        'items_finished_good_id',
        'name',
    ];

    protected $casts = [
        'required_quantity' => 'float',
    ];


    public function item()
    {
        return $this->belongsTo(ItemsFinishedGood::class, 'items_finished_good_id');
    }

    public function steps()
    {
        return $this->hasMany(ProductionSchemaStep::class, 'production_schema_id')->orderBy('step_number');
    }

    public function machine()
    {
        return $this->belongsTo(Machines::class, 'machine_id');
    }

    public function operation()
    {
        return $this->belongsTo(Operationmachine::class, 'operationmachine_id');
    }

    public function material()
    {
        return $this->belongsTo(ProductionMaterial::class, 'production_material_id');
    }
    /**
	 * Boot model and attach creating listener to generate barcode starting with 8800.
	 */
	  protected static function booted()
    {
        static::created(function ($productionSchema) {
            $prefix = '8800';
            $id = $productionSchema->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($productionSchema->barcode !== $barcode) {
                $productionSchema->barcode = $barcode;
                $productionSchema->save();
            }
        });
    }
}
