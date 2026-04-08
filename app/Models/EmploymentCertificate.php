<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmploymentCertificate extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'user_id',
        'barcode',
        'nip',
        'company_name',
        'street',
        'zip_code',
        'city',
        'start_date',
        'end_date',
        'position',
        'additional_info',
        'work_certificate_file_path',
    ];


    protected static function booted()
    {
        static::created(function ($workCertificate) {
            $prefix = '7000';
            $id = $workCertificate->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($workCertificate->barcode !== $barcode) {
                $workCertificate->barcode = $barcode;
                $workCertificate->save();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
