<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CompanyController extends Controller
{
    public function __construct(
        private readonly UserProfileService $userProfileService
    ) {
    }

    public function nipLookup(string $nip): JsonResponse
    {
        // Walidacja NIP
        if (!preg_match('/^\d{10}$/', $nip)) {
            return response()->json([
                'ok' => false,
                'error' => 'NIP musi składać się z 10 cyfr'
            ]);
        }

        try {
            $result = $this->userProfileService->getCompanyDataByNip($nip);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'error' => 'Błąd serwera: ' . $e->getMessage()
            ]);
        }
    }
}
