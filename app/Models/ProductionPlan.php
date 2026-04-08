<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'production_material_id',
        'scheduled_at',
        'production_time_minutes',
        'production_time_seconds',
        'quantity',
    ];
}
