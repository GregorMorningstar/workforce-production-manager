<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class UserProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'barcode',
        'phone',
        'pesel',
        'address',
        'profile_photo',
        'birth_date',
        'gender',
        'emergency_contact_name',
        'emergency_contact_phone',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'address' => 'array',
    ];

    protected $appends = [
        'profile_photo_url',
    ];

    protected static function booted()
    {
        // usuwanie pliku przy usuwaniu profilu
        static::deleting(function ($profile) {
            if ($profile->profile_photo && Storage::disk('public')->exists($profile->profile_photo)) {
                Storage::disk('public')->delete($profile->profile_photo);
            }
        });

        // generowanie barcode po utworzeniu
        static::created(function ($userProfile) {
            if (!$userProfile->barcode) {
                $prefix = '5000';
                $idStr = (string) $userProfile->id;
                $barcode = $prefix . str_pad($idStr, 13 - strlen($prefix), '0', STR_PAD_LEFT);
                $userProfile->updateQuietly(['barcode' => $barcode]);
            }
        });
    }

    /**
     * Relacja do użytkownika
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Accessor dla pełnej ścieżki zdjęcia profilowego
     */
    public function getProfilePhotoUrlAttribute(): ?string
    {
        if (!$this->profile_photo) {
            return null;
        }

        if (Storage::disk('public')->exists($this->profile_photo)) {
            return Storage::disk('public')->url($this->profile_photo);
        }

        return null;
    }

    /**
     * Sprawdź czy profil jest kompletny
     */
    public function isComplete(): bool
    {
        return !empty($this->phone) &&
               !empty($this->pesel) &&
               !empty($this->address) &&
               !empty($this->birth_date);
    }

    /**
     * Oblicz procent ukończenia profilu
     */
    public function getCompletionPercentage(): float
    {
        $fields = ['phone', 'pesel', 'address', 'birth_date', 'profile_photo'];
        $completed = 0;

        foreach ($fields as $field) {
            if (!empty($this->$field)) {
                $completed++;
            }
        }

        return round(($completed / count($fields)) * 100, 2);
    }
}
