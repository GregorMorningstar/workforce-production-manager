<?php


namespace App\Repositories\Eloquent;

use App\Models\SchoolCertificate;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\EmploymentCertificate;
use App\Repositories\Contracts\FlagRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;

class EloquentFlagRepository implements FlagRepositoryInterface
{
    public function __construct(private readonly User $user,
                                private readonly UserProfile $userProfile,
                                private readonly SchoolCertificate $schoolCertificate,
                                private readonly EmploymentCertificate $employmentCertificate)
    {
    }

    // zwraca kolekcję rekordów
    public function addressFlagsByUser(): Collection
    {
        $address = $this->userProfile->where('user_id', Auth::id())->get();
        $addresCount = $address->count();

        if ($addresCount > 0) {
            $user = $this->user->find(Auth::id());
          //  dd($user);
            $user->is_complited_address = true;
            $user->save();

            return $address;
        } else {
            $user = $this->user->find(Auth::id());
            $user->is_complited_address = false;
            $user->save();

        }

        return new Collection();
    }

    public function educationFlagsByUser(): Collection
    {
        $education = $this->schoolCertificate->where('user_id', Auth::id())->get();
        $educationCount = $education->count();

        if ($educationCount > 0) {
            $user = $this->user->find(Auth::id());
            $user->is_complited_education = true;
            $user->save();

            return $education;
        } else {
            $user = $this->user->find(Auth::id());
            $user->is_complited_education = false;
            $user->save();

        }

        return new Collection();
    }
    public function employmentFlagsByUser(): Collection
    {
         $employment = $this->employmentCertificate->where('user_id', Auth::id())->get();
        $employmentCount = $employment->count();

        if ($employmentCount > 0) {
            $user = $this->user->find(Auth::id());
            $user->is_complited_work_time = true;
            $user->save();

            return $employment;
        } else {
            $user = $this->user->find(Auth::id());
            $user->is_complited_work_time = false;
            $user->save();
        }

        return new Collection();
    }
}
