<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MachineFailureRepairAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'machine_failure_repair_id',
        'description',
        'user_id',
        'performed_at',
    ];

    public function repair()
    {
        return $this->belongsTo(MachineFailureRepair::class, 'machine_failure_repair_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
