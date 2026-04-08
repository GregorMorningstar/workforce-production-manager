<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ItemsFinishedGood extends Model
{
	use HasFactory;

    protected $table = 'items_finished_goods';

    protected $fillable = [
        'name',
        'description',
        'image_path',
        'barcode',
        'time_of_production',
        'price',
        'stock',
    ];

    public function productionSchema()
    {
        return $this->hasOne(ProductionSchema::class, 'items_finished_good_id');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'items_finished_good_id');
    }

	/**
	 * Boot model and attach creating listener to generate barcode starting with 8000.
	 */
	  protected static function booted()
    {
        static::created(function ($itemsFinishedGood) {
            $prefix = '8000';
            $id = $itemsFinishedGood->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($itemsFinishedGood->barcode !== $barcode) {
                $itemsFinishedGood->barcode = $barcode;
                $itemsFinishedGood->save();
            }
        });
    }
}
