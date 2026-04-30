<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\File;
use App\Models\Department;
use App\Models\Machines;
use App\Enums\MachineStatus;

class MachineSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Usuń istniejące wpisy
        Machines::query()->delete();

        // Utwórz folder na obrazy jeśli nie istnieje
        $storageMachinesPath = storage_path('app/public/images/machines');

        File::ensureDirectoryExists($storageMachinesPath);

        $machines = [
            // Odlewnia
            [
                'name' => 'Piec indukcyjny do aluminium',
                'model' => 'Nabertherm N 500/65',
                'serial_number' => 'NAB-2020-8841',
                'production_year' => 2020,
                'department' => 'Odlewnia',
                'image_url' => 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Kokila grawitacyjna obrotowa',
                'model' => 'LPM GR 800',
                'serial_number' => 'LPM-2019-4452',
                'production_year' => 2019,
                'department' => 'Odlewnia',
                'image_url' => 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop',
            ],

            // Ślusarnia
            [
                'name' => 'Centrum obróbcze CNC',
                'model' => 'Haas VF-2SS',
                'serial_number' => 'HAAS-2021-3391',
                'production_year' => 2021,
                'department' => 'Ślusarnia',
                'image_url' => 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Tokarka CNC z osiowym podajnikiem',
                'model' => 'DMG Mori CL-2000',
                'serial_number' => 'DMG-2022-1105',
                'production_year' => 2022,
                'department' => 'Ślusarnia',
                'image_url' => 'https://images.unsplash.com/photo-1581094372819-61d49c5d137f?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Automatyczna piła taśmowa',
                'model' => 'Bomar Ergonomic 320.258',
                'serial_number' => 'BOM-2018-7723',
                'production_year' => 2018,
                'department' => 'Ślusarnia',
                'image_url' => 'https://images.unsplash.com/photo-1504148455328-add624c71b5f?w=800&h=600&fit=crop',
            ],

            // Lakiernia
            [
                'name' => 'Kabina lakiernicza z filtracją',
                'model' => 'Junair Spray Cube 3000',
                'serial_number' => 'JUN-2021-5567',
                'production_year' => 2021,
                'department' => 'Lakiernia',
                'image_url' => 'https://images.unsplash.com/photo-1581094289703-4b8ef0b64761?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Piec tunelowy do polimerizacji',
                'model' => 'Eisenmann E-Coat 200',
                'serial_number' => 'EIS-2019-9912',
                'production_year' => 2019,
                'department' => 'Lakiernia',
                'image_url' => 'https://images.unsplash.com/photo-1581094372819-61d49c5d137f?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Pistolet natryskowy elektrostatyczny',
                'model' => 'Wagner PEM-X1',
                'serial_number' => 'WAG-2023-0044',
                'production_year' => 2023,
                'department' => 'Lakiernia',
                'image_url' => 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop',
            ],

            // Spawalnia
            [
                'name' => 'Robot spawalniczy MIG/MAG',
                'model' => 'Fanuc ARC Mate 100iD',
                'serial_number' => 'FAN-2020-2288',
                'production_year' => 2020,
                'department' => 'Spawalnia',
                'image_url' => 'https://images.unsplash.com/photo-1581094372956-c1383957190f?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Spawarka półautomatyczna',
                'model' => 'Kemppi FastMig X 450',
                'serial_number' => 'KEM-2019-6671',
                'production_year' => 2019,
                'department' => 'Spawalnia',
                'image_url' => 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Stół spawalniczy obrotowy',
                'model' => 'Digma DW 2000',
                'serial_number' => 'DIG-2022-8855',
                'production_year' => 2022,
                'department' => 'Spawalnia',
                'image_url' => 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=800&h=600&fit=crop',
            ],

            // Tapiceria
            [
                'name' => 'Automatyczna maszyna do szycia',
                'model' => 'Tajima TMAR-II 1501',
                'serial_number' => 'TAJ-2021-3334',
                'production_year' => 2021,
                'department' => 'Tapiceria',
                'image_url' => 'https://images.unsplash.com/photo-1581094372819-61d49c5d137f?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Stacjonarny nóż do cięcia pianki',
                'model' => 'Eastman Eagle C125',
                'serial_number' => 'EAS-2020-7741',
                'production_year' => 2020,
                'department' => 'Tapiceria',
                'image_url' => 'https://images.unsplash.com/photo-1504148455328-add624c71b5f?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Prasa do formowania siedzisk',
                'model' => 'Hidraulik OWM 100T',
                'serial_number' => 'HID-2019-5562',
                'production_year' => 2019,
                'department' => 'Tapiceria',
                'image_url' => 'https://images.unsplash.com/photo-1581094289703-4b8ef0b64761?w=800&h=600&fit=crop',
            ],

            // Montaż końcowy
            [
                'name' => 'Stanowisko montażowe obrotowe',
                'model' => 'Własna konstrukcja SM-01',
                'serial_number' => 'WKS-2022-001',
                'production_year' => 2022,
                'department' => 'Montaż końcowy',
                'image_url' => 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Prasa montażowa hydrauliczna',
                'model' => 'Dake 5-353',
                'serial_number' => 'DAK-2020-4490',
                'production_year' => 2020,
                'department' => 'Montaż końcowy',
                'image_url' => 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Wkrętarka elektryczna z programatorem',
                'model' => 'Atlas Copco EBL drove',
                'serial_number' => 'ATC-2023-1129',
                'production_year' => 2023,
                'department' => 'Montaż końcowy',
                'image_url' => 'https://images.unsplash.com/photo-1581094372956-c1383957190f?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'System podsłuchu (testy)',
                'model' => 'Fluke ii900 Sonic',
                'serial_number' => 'FLU-2021-8821',
                'production_year' => 2021,
                'department' => 'Montaż końcowy',
                'image_url' => 'https://images.unsplash.com/photo-1504148455328-add624c71b5f?w=800&h=600&fit=crop',
            ],

            // Kontrola jakości
            [
                'name' => 'Tester wytrzymałościowy krzeseł',
                'model' => 'IDM F002-M1',
                'serial_number' => 'IDM-2020-3356',
                'production_year' => 2020,
                'department' => 'Kontrola jakości',
                'image_url' => 'https://images.unsplash.com/photo-1581094289703-4b8ef0b64761?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Cyfrowa waga platformowa',
                'model' => 'RADWAG WLC 150/5',
                'serial_number' => 'RAD-2021-7788',
                'production_year' => 2021,
                'department' => 'Kontrola jakości',
                'image_url' => 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Suwmiarka cyfrowa systemowa',
                'model' => 'Mitutoyo CD-30CPX',
                'serial_number' => 'MIT-2022-9901',
                'production_year' => 2022,
                'department' => 'Kontrola jakości',
                'image_url' => 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop',
            ],

            // Pakowanie
            [
                'name' => 'Automatyczna wiązarka kartonów',
                'model' => 'Samula KZ-2/40',
                'serial_number' => 'SAM-2019-2234',
                'production_year' => 2019,
                'department' => 'Pakowanie',
                'image_url' => 'https://images.unsplash.com/photo-1581094372819-61d49c5d137f?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Aplikator etykiet logistycznych',
                'model' => 'Zebra ZT411',
                'serial_number' => 'ZEB-2021-4456',
                'production_year' => 2021,
                'department' => 'Pakowanie',
                'image_url' => 'https://images.unsplash.com/photo-1504148455328-add624c71b5f?w=800&h=600&fit=crop',
            ],
            [
                'name' => 'Owijarka do palet ze stretch',
                'model' => 'Robopac Robot S6',
                'serial_number' => 'ROB-2020-6678',
                'production_year' => 2020,
                'department' => 'Pakowanie',
                'image_url' => 'https://images.unsplash.com/photo-1581094289703-4b8ef0b64761?w=800&h=600&fit=crop',
            ],
        ];

        foreach ($machines as $index => $machine) {
            // Pobierz i zapisz obraz
            $imagePath = null;
            // Przygotuj nazwę pliku docelowego (domyślnie pusta, zostanie ustawiona przy kopiowaniu/pobieraniu)
            $imageName = null;
            $fullImagePath = null;

            // Najpierw spróbuj znaleźć plik lokalny w kilku kandydackich folderach
            $localDirs = [
                base_path('storage/images/machines'),
                storage_path('app/public/images/machines'),
                public_path('storage/images/machines'),
                base_path('resources/images/machines'),
                // dodatkowy katalog podany przez użytkownika
                storage_path('image'),
                storage_path('image/machines'),
                base_path('storage/image'),
            ];

            $normalize = function ($s) {
                $s = mb_strtolower(trim($s));
                if (function_exists('transliterator_transliterate')) {
                    $s = transliterator_transliterate('Any-Latin; Latin-ASCII;', $s);
                } else {
                    $s = iconv('UTF-8', 'ASCII//TRANSLIT', $s);
                }
                $s = preg_replace('/[^a-z0-9]+/i', '', $s);
                return $s;
            };

            $foundLocal = false;
            $machineKey = $normalize($machine['name']);

            foreach ($localDirs as $dir) {
                if (!is_dir($dir)) {
                    continue;
                }
                $files = glob($dir . '/*');
                foreach ($files as $f) {
                    if (!is_file($f)) continue;
                    $base = pathinfo($f, PATHINFO_FILENAME);
                    if ($normalize($base) === $machineKey) {
                        // Skopiuj do storage public
                        $origBasename = pathinfo($f, PATHINFO_BASENAME);
                        $imageName = $origBasename;
                        $fullImagePath = $storageMachinesPath . '/' . $imageName;
                        File::ensureDirectoryExists(dirname($fullImagePath));
                        copy($f, $fullImagePath);
                        if (file_exists($fullImagePath) && filesize($fullImagePath) > 0) {
                            // zapisuj w DB ścieżkę bez pierwszego 'storage/' - front i blade powinien dodawać '/storage/' prefix
                            $imagePath = 'images/machines/' . $imageName;
                            $foundLocal = true;
                            echo "✓ Użyto lokalnego obrazu dla: {$machine['name']} (z {$dir})\n";
                            break 2;
                        }
                    }
                }
            }

            // Jeśli nie znaleziono lokalnego pliku, spróbuj pobrać z URL (jeśli podany)
            if (!$foundLocal && !empty($machine['image_url'])) {
                try {
                    echo "Pobieranie obrazu z internetu dla: {$machine['name']}\n";
                    $response = Http::timeout(30)
                                  ->withHeaders(['User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'])
                                  ->get($machine['image_url']);

                    if ($response->successful()) {
                        // wybierz rozszerzenie z URL lub domyślne jpg
                        $urlPath = parse_url($machine['image_url'], PHP_URL_PATH) ?: '';
                        $ext = pathinfo($urlPath, PATHINFO_EXTENSION);
                        if (empty($ext)) {
                            $ext = 'jpg';
                        }
                        // stwórz nazwę pliku na bazie nazwy maszyny
                        $slug = $normalize($machine['name']);
                        $imageName = $slug . '.' . $ext;
                        $fullImagePath = $storageMachinesPath . '/' . $imageName;

                        File::ensureDirectoryExists(dirname($fullImagePath));
                        $saved = file_put_contents($fullImagePath, $response->body());
                        if ($saved !== false && file_exists($fullImagePath) && filesize($fullImagePath) > 0) {
                            $imagePath = 'images/machines/' . $imageName;
                            echo "✓ Obraz pobrany i zapisany: {$imageName} ({$saved} bytes)\n";
                        } else {
                            echo "✗ Nie udało się zapisać pobranego obrazu: {$imageName}\n";
                        }
                    } else {
                        echo "✗ HTTP Error {$response->status()} dla {$machine['name']}\n";
                    }
                } catch (\Exception $e) {
                    echo "✗ Błąd pobierania obrazu dla {$machine['name']}: " . $e->getMessage() . "\n";
                }
            }

            // Znajdź department_id na podstawie nazwy
            $departmentId = Department::where('name', $machine['department'])->value('id');

            if (!$departmentId) {
                echo "⚠ Nie znaleziono department: {$machine['department']}\n";
            }

            Machines::create([
                'name' => $machine['name'],
                'model' => $machine['model'],
                'serial_number' => $machine['serial_number'],
                'year_of_production' => $machine['production_year'],
                'department_id' => $departmentId,
                'image_path' => $imagePath,
                'description' => 'Maszyna do ' . strtolower($machine['name']),
                'status' => MachineStatus::ACTIVE->value,
            ]);
        }

        echo "\nZakończono seedowanie maszyn z obrazami.\n";
    }
}
