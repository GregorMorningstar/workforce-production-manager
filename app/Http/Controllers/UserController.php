<?php

namespace App\Http\Controllers;

use App\Services\Contracts\UserServiceInterface;
use App\Services\Contracts\EducationServiceInterface;
 use App\Services\Contracts\EmploymentCertificateServiceInterface;
use App\Enums\StatusAplication;
use App\Enums\EducationsDegree;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(private readonly UserServiceInterface $users,
                                private readonly EducationServiceInterface $educationService,
                                    private readonly EmploymentCertificateServiceInterface $employmentCertificateService)
    {
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 6);
        $filters = [
            'name' => $request->query('name'),
            'department' => $request->query('department'),
            'barcode' => $request->query('barcode'),
        ];

        $users = $this->users->getAllByRole($perPage, 'employee', $filters);

        return Inertia::render('moderator/user/index', [
            'users' => $users,
            'filters' => $filters,
        ]);
    }

    public function show(int $id)
    {
        $user = $this->users->getById($id);
        dd($user);
        return Inertia::render('moderator/user/show', ['user' => $user]);
    }

    public function confirmationEducation(Request $request)
    {
        $filters = [
            'name'      => $request->query('name'),
            'school'    => $request->query('school'),
            'year_from' => $request->query('year_from'),
            'year_to'   => $request->query('year_to'),
            'per_page'  => (int) $request->query('per_page', 6),
        ];

        $pendingCertificates = $this->educationService->getAllPendingCertificates($filters);

        return Inertia::render('moderator/user/education/confirmation-education', [
            'pendingCertificates' => $pendingCertificates,
            'filters' => $filters,
        ]);
    }

    public function confirmationWorkCertificates(Request $request)
    {

    $filters = [
            'name'         => $request->query('name'),
            'company_name' => $request->query('company_name'),
            'nip'          => $request->query('nip'),
            'start_date_from' => $request->query('start_date_from'),
            'start_date_to'   => $request->query('start_date_to'),
            'end_date_from'   => $request->query('end_date_from'),
            'end_date_to'     => $request->query('end_date_to'),
            'per_page'     => (int) $request->query('per_page', 6),
        ];

        $getAllCertificatesWithPendingStatus = $this->users->getAllCertificatesWithPendingStatus($filters);
      // dd($getAllCertificatesWithPendingStatus);
        return Inertia::render('moderator/user/work/confirmation-work-certificates', [
            'pendingCertificates' => $getAllCertificatesWithPendingStatus,
            'filters' => $filters,
        ]);
    }


public function approveEducation(Request $request)
{
    $validatedData = $request->validate([
        'certificate_id' => 'required|integer|exists:school_certificates,id',
        'action' => 'required|string|in:approve,reject',
    ]);

    $schoolCertificate = $this->educationService
        ->getCertificateWithUserById($validatedData['certificate_id']);
    if (!$schoolCertificate) {
        return redirect()->back()->withErrors(['certificate' => 'Nie znaleziono świadectwa.']);
    }
    try {
        $updated = $this->educationService->setStatusCertificate(
            $schoolCertificate,
            $validatedData['action'] === 'approve'
                ? StatusAplication::APPROVED
                : StatusAplication::REJECTED
        );

        if (!$updated) {
            return redirect()->back()->withErrors(['certificate' => 'Nie udało się zaktualizować statusu.']);
        }

        if ($validatedData['action'] === 'approve') {
            $certYears = EducationsDegree::yearsFor($schoolCertificate->education_level);
            $certMonths = (int) $certYears * 12;

            $user = $this->users->getById($schoolCertificate->user_id);
            if ($user) {
                $currentMonths = (int) ($user->monthly_education_time_target ?? 0);

                \Log::info("Zatwierdzanie certyfikatu - user_id: {$user->id}, education_level: {$schoolCertificate->education_level}, certYears: {$certYears}, certMonths: {$certMonths}, currentMonths: {$currentMonths}");

                if ($certMonths > $currentMonths) {
                    $user->monthly_education_time_target = $certMonths;
                    $saved = $user->save();
                    \Log::info("Zapisano nową wartość monthly_education_time_target = {$certMonths}, status: " . ($saved ? 'SUCCESS' : 'FAILED'));

                        if($saved) {
                            // sprawdź i ewentualnie zaktualizuj roczne dni urlopu
                            $this->users->getAnnualLeaveDays($user->id);
                            \Log::info("sprawdzano ilosc dni do urlopu");
                        } else {
                            \Log::error("Nie udało się zaktualizować monthly_education_time_target dla user_id: {$user->id}");
                        }
                    // kontynuuj — końcowy redirect zwróci się do listy potwierdzeń
                } else {
                    \Log::info("Pominięto aktualizację - certMonths ({$certMonths}) <= currentMonths ({$currentMonths})");
                }
            } else {
                \Log::warning("Nie znaleziono użytkownika o ID: {$schoolCertificate->user_id}");
            }
        }

        return redirect()->back()->with('success', 'Status świadectwa został zaktualizowany.');
    } catch (\Throwable $e) {
        throw new \Exception('Błąd podczas aktualizacji statusu świadectwa: ' . $e->getMessage());
    }
}

public function approveWorkCertificate(Request $request)
{

//dd(request()->all());
    $actualCertificate = $this->employmentCertificateService->getCertificatesByUserId($request->input('certificate_id'));
    if ($actualCertificate instanceof \Illuminate\Database\Eloquent\Collection) {
        $actualCertificate = $actualCertificate->first();
    }
    //zmiana statusu
if(!$actualCertificate) {
    return redirect()->back()->withErrors(['certificate' => 'Nie znaleziono certyfikatu.']);
}
    $updated = $this->employmentCertificateService->setStatusCertificate(
        $actualCertificate,
        $request->input('action') === 'approve'
            ? StatusAplication::APPROVED
            : StatusAplication::REJECTED
    );
    if (!$updated) {
        return redirect()->back()->withErrors(['certificate' => 'Nie udało się zaktualizować statusu.']);
    }

    // Obliczanie ilości miesięcy i aktualizacja użytkownika tylko przy zatwierdzeniu
    if ($request->input('action') === 'approve') {
        $monthlyWorkTimeTarget = $this->employmentCertificateService->calculateTenureInMonths($actualCertificate);

        if ($monthlyWorkTimeTarget > 0) {
            $user = $this->users->getById($actualCertificate->user_id);
            if ($user) {
                try {
                    $currentMonths = (int) ($user->monthly_work_time_target ?? 0);
                    $newTotal = $currentMonths + $monthlyWorkTimeTarget;
                    $save = $this->users->setWorkedMonths($user->id, $newTotal);

                    \Log::info("Zaktualizowano monthly_work_time_target dla user_id: {$user->id}, dodano: {$monthlyWorkTimeTarget}, nowa suma: {$newTotal}");
                if($save) {
                    // sprawdź i ewentualnie zaktualizuj roczne dni urlopu
                    $this->users->getAnnualLeaveDays($user->id);
                    \Log::info("sprawdzano ilosc dni do urlopu");
                } else {
                    \Log::error("Nie udało się zaktualizować monthly_work_time_target dla user_id: {$user->id}");
                }
                    } catch (\Throwable $e) {
                    throw new \Exception('Błąd podczas aktualizacji miesięcznego czasu pracy: ' . $e->getMessage());
                }
            }
        }
    }

    return redirect()->back()->with('success', 'Status certyfikatu został zaktualizowany.');
}

}
