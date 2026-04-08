<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Machines;
use App\Models\LeaveBalance;
use App\Models\MachineFailure;
use App\Models\UserProfile;
use Carbon\Carbon;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'barcode',
        'department_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'department_id',
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'two_factor_confirmed_at' => 'datetime',
        'role' => \App\Enums\UserRole::class,
        'is_complited_education' => 'boolean',
        'is_complited_work_time' => 'boolean',
        'is_complited_address' => 'boolean',
    ];

    protected static function booted()
    {
        static::created(function ($user) {
            $prefix = '1000';
            $id = $user->id;
            $barcode = $prefix . str_pad($id, 13 - strlen($prefix), '0', STR_PAD_LEFT);
            if ($user->barcode !== $barcode) {
                $user->barcode = $barcode;
                $user->save();
            }
        });

        static::created(function ($user) {
            $seniorityThreshold = 5; // próg lat stażu dla 24 dni

            // pobierz datę zatrudnienia jeśli istnieje lub użyj daty utworzenia użytkownika
            $employmentStart = $user->employment_start_date ?? $user->created_at->toDateString();
            $seniorityYears = Carbon::parse($employmentStart)->diffInYears(Carbon::now());

            // oblicz przysługujące dni urlopu
            $entitlement = $seniorityYears >= $seniorityThreshold ? 24 : 20;

            LeaveBalance::create([
                'user_id' => $user->id,
                'year' => Carbon::now()->year,
                'leave_type' => 'vacation',
                'entitlement_days' => $entitlement,
                'used_days' => 0,
                'remaining_days' => $entitlement,
                'request_days' => 2,
                'request_used' => 0,
                'seniority_years' => $seniorityYears,
                'work_time' => 0,
                'education_time' => 0,
                'employment_start_date' => $employmentStart,
            ]);
        });
    }

    /**
     * Department assigned to the user (single).
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * Departments this user belongs to (many-to-many via `department_user` pivot).
     */
    // If a user can belong to one department, use the `department()` relation below.

    // user może być właścicielem wielu maszyn (pole user_id w machines)
    public function ownedMachines(): HasMany
    {
        return $this->hasMany(Machines::class, 'user_id');
    }

    // user może być przypisany do wielu maszyn przez pivot machine_user
    public function machines()
    {
        return $this->hasMany(Machines::class, 'user_id');


    }

    //relacja z MachineFailure (1:N)
    public function machineFailures(): HasMany
    {
        return $this->hasMany(MachineFailure::class, 'user_id');
    }

    //relacja z Leaves (1:N)
    public function leaves(): HasMany
    {
        return $this->hasMany(Leaves::class, 'user_id');
    }

    //relacja z UserProfile (1:1)
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /**
     * Accessor for avatar - returns profile photo URL if exists
     */
    public function getAvatarAttribute(): ?string
    {
        return $this->profile?->profile_photo_url;
    }

    public function schoolCertificates(): HasMany
    {
        return $this->hasMany(SchoolCertificate::class);
    }

    public function employmentCertificates(): HasMany
    {
        return $this->hasMany(EmploymentCertificate::class);
    }

    // relacja z LeaveBalance (1:N)
    public function leaves_balance(): HasMany
    {
        return $this->hasMany(LeaveBalance::class, 'user_id');
    }
}
