<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\CompanyLookupService;

class CompanyController extends Controller
{
    protected CompanyLookupService $service;

    public function __construct(CompanyLookupService $service)
    {
        $this->service = $service;
    }

    /**
     * GET /company-by-nip?nip=1234563218
     * or POST/GET with `text` param containing NIP inside text.
     */
    public function show(Request $request)
    {
        $nip = $request->query('nip');

        if (!$nip && $request->filled('text')) {
            $nip = $this->service->extractNip($request->input('text'));
        }

        if (!$nip) {
            return response()->json(['error' => 'NIP not provided or not found in text'], 422);
        }

        try {
            $data = $this->service->fetchByNip($nip);
            return response()->json($data);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
