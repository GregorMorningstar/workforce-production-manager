<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionPerformance extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_item_production_plan_id',
        'order_item_production_event_id',
        'user_id',
        'department_id',
        'machine_id',
        'operationmachine_id',
        'norm_required_seconds',
        'actual_task_seconds',
        'norm_usage_percent',
        'norm_performance_percent',
        'completed_cycles',
        'required_cycles',
        'occurred_at',
        'payload',
    ];

    protected $casts = [
        'norm_usage_percent' => 'float',
        'norm_performance_percent' => 'float',
        'completed_cycles' => 'integer',
        'required_cycles' => 'integer',
        'payload' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function plan()
    {
        return $this->belongsTo(OrderItemProductionPlan::class, 'order_item_production_plan_id');
    }

    public function event()
    {
        return $this->belongsTo(OrderItemProductionEvent::class, 'order_item_production_event_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function machine()
    {
        return $this->belongsTo(Machines::class, 'machine_id');
    }

    public function operation()
    {
        return $this->belongsTo(Operationmachine::class, 'operationmachine_id');
    }
}
