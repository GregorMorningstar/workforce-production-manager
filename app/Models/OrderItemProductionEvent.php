<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItemProductionEvent extends Model
{
    use HasFactory;

    protected $table = 'order_item_production_events';

    protected $fillable = [
        'order_item_production_plan_id',
        'user_id',
        'event_type',
        'message',
        'norm_required_seconds',
        'actual_task_seconds',
        'norm_usage_percent',
        'norm_performance_percent',
        'payload',
        'occurred_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'occurred_at' => 'datetime',
        'norm_usage_percent' => 'float',
        'norm_performance_percent' => 'float',
    ];

    public function plan()
    {
        return $this->belongsTo(OrderItemProductionPlan::class, 'order_item_production_plan_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
