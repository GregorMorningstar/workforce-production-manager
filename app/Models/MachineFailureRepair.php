<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class MachineFailureRepair extends Model
{
use HasFactory;
    protected $fillable = [
        'machine_failure_id',
        'barcode',
        'status',
        'cost',
        'repair_order_no',
        'description',
        'started_at',
        'finished_at',
    ];


    protected static function booted()
    {
        static::created(function ($machineFailureRaported) {
            $prefix = '3300';
            $id = $machineFailureRaported->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($machineFailureRaported->barcode !== $barcode) {
                $machineFailureRaported->barcode = $barcode;
                $machineFailureRaported->save();
            }
        });
    }


    public function machineFailure()
    {
        return $this->belongsTo(MachineFailure::class);
    }

    public function actions()
    {
        return $this->hasMany(\App\Models\MachineFailureRepairAction::class, 'machine_failure_repair_id');
    }


}
