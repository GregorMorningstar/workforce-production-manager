<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class CompanyLookupService
{
    /**
     * Extract NIP from arbitrary text. Returns 10-digit NIP or null.
     */
    public function extractNip(string $text): ?string
    {
        $digits = preg_replace('/\D+/', '', $text);
        return strlen($digits) === 10 ? $digits : null;
    }

    /**
     * Fetch company data by NIP using public MF API.
     * Returns decoded JSON as array.
     *
     * Throws InvalidArgumentException or RuntimeException on error.
     */
    public function fetchByNip(string $nip): array
    {
        $nip = preg_replace('/\D+/', '', $nip);
        if (strlen($nip) !== 10) {
            throw new \InvalidArgumentException('NIP must contain exactly 10 digits.');
        }

        $url = "https://wl-api.mf.gov.pl/api/search/nip/{$nip}";
        $response = Http::timeout(10)->get($url);

        if ($response->failed()) {
            throw new \RuntimeException('API request failed with status ' . $response->status());
        }

        return $response->json();
    }
}
