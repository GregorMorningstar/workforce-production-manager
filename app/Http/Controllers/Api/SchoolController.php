<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SchoolController extends Controller
{
    public function searchSchools(Request $request)
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        try {
            // Cache key dla zapytania
            $cacheKey = 'schools_search_' . md5($query);

            // Sprawdź cache (cache na 1 godzinę)
            $schools = Cache::remember($cacheKey, 3600, function () use ($query) {
                return $this->fetchSchoolsFromRSPO($query);
            });

            return response()->json($schools);

        } catch (\Exception $e) {
            Log::error('Błąd podczas pobierania szkół z RSPO: ' . $e->getMessage());

            // Fallback - zwróć przykładowe dane lokalne w przypadku błędu API
            return response()->json($this->getFallbackSchools($query));
        }
    }

    private function fetchSchoolsFromRSPO(string $query): array
    {
        try {
            // API RSPO - wyszukiwanie szkół
            $response = Http::timeout(10)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'User-Agent' => 'PANS-Master-App/1.0'
                ])
                ->get('https://api-rspo.men.gov.pl/api/schools/search', [
                    'name' => $query,
                    'limit' => 10
                ]);

            if (!$response->successful()) {
                Log::warning('RSPO API nieudane: ' . $response->status());
                return $this->getFallbackSchools($query);
            }

            $data = $response->json();

            return $this->mapRSPOResponse($data);

        } catch (\Exception $e) {
            Log::error('Błąd HTTP przy łączeniu z RSPO: ' . $e->getMessage());
            return $this->getFallbackSchools($query);
        }
    }

    private function mapRSPOResponse(array $data): array
    {
        if (!isset($data['schools']) || !is_array($data['schools'])) {
            return [];
        }

        return array_map(function ($school) {
            return [
                'id' => $school['id'] ?? uniqid(),
                'name' => $school['name'] ?? 'Nieznana nazwa',
                'address' => $this->formatAddress($school),
                'city' => $school['city'] ?? $school['locality'] ?? 'Nieznane miasto',
                'type' => $this->mapSchoolType($school['type'] ?? 'other')
            ];
        }, array_slice($data['schools'], 0, 10));
    }

    private function formatAddress(array $school): string
    {
        $addressParts = [];

        if (!empty($school['street'])) {
            $addressParts[] = $school['street'];
        }
        if (!empty($school['building_number'])) {
            $addressParts[] = $school['building_number'];
        }
        if (!empty($school['postal_code'])) {
            $addressParts[] = $school['postal_code'];
        }
        if (!empty($school['city']) || !empty($school['locality'])) {
            $addressParts[] = $school['city'] ?? $school['locality'];
        }

        return implode(' ', $addressParts) ?: 'Brak adresu';
    }

    private function mapSchoolType(string $type): string
    {
        return match(strtolower($type)) {
            'podstawowa', 'primary' => 'Podstawowa',
            'gimnazjum', 'gymnasium' => 'Gimnazjum',
            'liceum', 'high_school' => 'Liceum',
            'technikum', 'technical' => 'Technikum',
            'zawodowa', 'vocational' => 'Zawodowa',
            'wyższa', 'university', 'higher' => 'Wyższa',
            'policealna', 'post_secondary' => 'Policealna',
            default => 'Inne'
        };
    }

    private function getFallbackSchools(string $query): array
    {
        // Lokalne dane fallback w przypadku problemów z API
        $schools = [
            [
                'id' => 1,
                'name' => 'PANS Krosno',
                'address' => 'ul. Kolejowa 7, 38-400 Krosno',
                'city' => 'Krosno',
                'type' => 'Wyższa'
            ],
            [
                'id' => 2,
                'name' => 'Politechnika Warszawska',
                'address' => 'Plac Politechniki 1, 00-661 Warszawa',
                'city' => 'Warszawa',
                'type' => 'Wyższa'
            ],
            [
                'id' => 3,
                'name' => 'Uniwersytet Warszawski',
                'address' => 'Krakowskie Przedmieście 26/28, 00-927 Warszawa',
                'city' => 'Warszawa',
                'type' => 'Wyższa'
            ],
            [
                'id' => 4,
                'name' => 'Uniwersytet Jagielloński',
                'address' => 'ul. Gołębia 24, 31-007 Kraków',
                'city' => 'Kraków',
                'type' => 'Wyższa'
            ],
            [
                'id' => 5,
                'name' => 'Politechnika Rzeszowska',
                'address' => 'al. Powstańców Warszawy 12, 35-959 Rzeszów',
                'city' => 'Rzeszów',
                'type' => 'Wyższa'
            ],
            [
                'id' => 6,
                'name' => 'Technikum Mechaniczne Krosno',
                'address' => 'ul. Piłsudskiego 8, 38-400 Krosno',
                'city' => 'Krosno',
                'type' => 'Technikum'
            ],
            [
                'id' => 7,
                'name' => 'I Liceum Ogólnokształcące Krosno',
                'address' => 'ul. Kościuszki 12, 38-400 Krosno',
                'city' => 'Krosno',
                'type' => 'Liceum'
            ],
            [
                'id' => 8,
                'name' => 'Zespół Szkół Ekonomicznych Krosno',
                'address' => 'ul. Bieszczadzka 5, 38-400 Krosno',
                'city' => 'Krosno',
                'type' => 'Technikum'
            ],
            [
                'id' => 9,
                'name' => 'AGH Akademia Górniczo-Hutnicza',
                'address' => 'al. Mickiewicza 30, 30-059 Kraków',
                'city' => 'Kraków',
                'type' => 'Wyższa'
            ],
            [
                'id' => 10,
                'name' => 'Uniwersytet Rzeszowski',
                'address' => 'ul. Rejtana 16C, 35-959 Rzeszów',
                'city' => 'Rzeszów',
                'type' => 'Wyższa'
            ],
        ];

        $filteredSchools = array_filter($schools, function ($school) use ($query) {
            return stripos($school['name'], $query) !== false;
        });

        usort($filteredSchools, function ($a, $b) use ($query) {
            $posA = stripos($a['name'], $query);
            $posB = stripos($b['name'], $query);

            if ($posA === $posB) {
                return strlen($a['name']) - strlen($b['name']);
            }

            return $posA - $posB;
        });

        return array_slice(array_values($filteredSchools), 0, 10);
    }
}
