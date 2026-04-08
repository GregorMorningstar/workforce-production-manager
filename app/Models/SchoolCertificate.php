<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolCertificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'barcode',
        'school_name',
        'school_address',
        'start_year',
        'end_year',
        'education_level',
        'certificate_path',
        'status'
    ];
 protected static function booted()
    {
        static::created(function ($schoolCertificate) {
            if (!$schoolCertificate->barcode) {
                $prefix = '6000';
                $idStr = (string) $schoolCertificate->id;
                $barcode = $prefix . str_pad($idStr, 13 - strlen($prefix), '0', STR_PAD_LEFT);
                $schoolCertificate->updateQuietly(['barcode' => $barcode]);
            }
        });
    }


    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
