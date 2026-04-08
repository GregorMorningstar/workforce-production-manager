<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItemProductionPlan extends Model
{
    use HasFactory;

    protected $table = 'order_item_production_plans';

    protected $fillable = [
        'order_id',
        'order_item_id',
        'items_finished_good_id',
        'barcode',
        'production_schema_id',
        'production_schema_step_id',
        'machine_id',
        'operationmachine_id',
        'production_material_id',
        'assigned_user_id',
        'planned_start_at',
        'planned_end_at',
        'order_quantity',
        'required_quantity_per_unit',
        'required_total_quantity',
        'unit',
        'status',
        'notes',
    ];

    protected $casts = [
        'planned_start_at' => 'datetime',
        'planned_end_at' => 'datetime',
        'required_quantity_per_unit' => 'float',
        'required_total_quantity' => 'float',
    ];

    protected static function booted()
    {
        static::created(function ($plan) {
            $prefix = '9200';
            $barcode = $prefix . str_pad((string) $plan->id, 13 - strlen($prefix), '0', STR_PAD_LEFT);

            if ($plan->barcode !== $barcode) {
                $plan->barcode = $barcode;
                $plan->save();
            }
        });
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }

    public function step()
    {
        return $this->belongsTo(ProductionSchemaStep::class, 'production_schema_step_id');
    }

    public function item()
    {
        return $this->belongsTo(ItemsFinishedGood::class, 'items_finished_good_id');
    }

    public function schema()
    {
        return $this->belongsTo(ProductionSchema::class, 'production_schema_id');
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

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function events()
    {
        return $this->hasMany(OrderItemProductionEvent::class, 'order_item_production_plan_id');
    }
}
