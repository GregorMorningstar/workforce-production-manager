<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name',
        'barcode',
        'status',
        'received_at',
        'planned_production_at',
        'finished_at',
        'real_finished_at',
        'description',
    ];


    protected static function booted()
    {
        static::created(function ($order) {
            $prefix = '9000';
            $id = $order->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($order->barcode !== $barcode) {
                $order->barcode = $barcode;
                $order->save();
            }
        });
    }
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

}
