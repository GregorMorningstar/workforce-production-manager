<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'items_finished_good_id',
        'quantity',
        'unit_price',
    ];

protected static function booted()
    {
        static::created(function ($orderItem) {
            $prefix = '9100';
            $id = $orderItem->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($orderItem->barcode !== $barcode) {
                $orderItem->barcode = $barcode;
                $orderItem->save();
            }
        });
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(ItemsFinishedGood::class, 'items_finished_good_id');
    }
}
