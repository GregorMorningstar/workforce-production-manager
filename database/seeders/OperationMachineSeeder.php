<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Machines;

class OperationMachineSeeder extends Seeder
{
    public function run(): void
    {
        // clear existing
        DB::table('operationmachines')->delete();

        $rows = [
            ['operation_name' => 'Cięcie profili stalowych', 'department' => 'Ślusarnia', 'machine_name' => 'Automatyczna piła taśmowa', 'duration' => 3, 'changeover' => 15, 'description' => 'Zmiana długości, kąta cięcia'],
            ['operation_name' => 'Odlew krzyżaka podstawy', 'department' => 'Odlewnia', 'machine_name' => 'Kokila grawitacyjna obrotowa', 'duration' => 12, 'changeover' => 30, 'description' => 'Rzeczywisty czas 12 min/szt, ale kokila 4-krotna (4 szt/ cykl)'],
            ['operation_name' => 'Obróbka skrawaniem krzyżaka', 'department' => 'Ślusarnia', 'machine_name' => 'Centrum obróbcze CNC', 'duration' => 8, 'changeover' => 45, 'description' => 'Wymiana uchwytów, programu CNC'],
            ['operation_name' => 'Spawanie ramy siedziska', 'department' => 'Spawalnia', 'machine_name' => 'Robot spawalniczy MIG/MAG', 'duration' => 6, 'changeover' => 60, 'description' => 'Nowy program robota, kalibracja'],
            ['operation_name' => 'Spawanie ramy oparcia', 'department' => 'Spawalnia', 'machine_name' => 'Stół spawalniczy obrotowy', 'duration' => 4, 'changeover' => 20, 'description' => 'Ręczne spawanie, zmiana pozycji'],
            ['operation_name' => 'Czyszczenie i szlifowanie spawów', 'department' => 'Spawalnia', 'machine_name' => 'Stół spawalniczy obrotowy', 'duration' => 3, 'changeover' => 10, 'description' => 'Wymiana tarczy szlifierskiej'],
            ['operation_name' => 'Lakierowanie proszkowe', 'department' => 'Lakiernia', 'machine_name' => 'Kabina lakiernicza z filtracją', 'duration' => 15, 'changeover' => 40, 'description' => 'Czyszczenie pistoletu, zmiana koloru RAL'],
            ['operation_name' => 'Polimerizacja (suszenie)', 'department' => 'Lakiernia', 'machine_name' => 'Piec tunelowy do polimerizacji', 'duration' => 25, 'changeover' => 0, 'description' => 'Ciągły proces, ładowanie wsadowe'],
            ['operation_name' => 'Cięcie pianki tapicerskiej', 'department' => 'Tapiceria', 'machine_name' => 'Stacjonarny nóż do cięcia pianki', 'duration' => 5, 'changeover' => 5, 'description' => 'Zmiana wzoru, regulacja głębokości'],
            ['operation_name' => 'Szycie tapicerki siedziska', 'department' => 'Tapiceria', 'machine_name' => 'Automatyczna maszyna do szycia', 'duration' => 18, 'changeover' => 25, 'description' => 'Wymiana nici, programu, szpulek'],
            ['operation_name' => 'Szycie siatki oparcia', 'department' => 'Tapiceria', 'machine_name' => 'Automatyczna maszyna do szycia', 'duration' => 12, 'changeover' => 15, 'description' => 'Wymiana nici, programu'],
            ['operation_name' => 'Formowanie siedziska', 'department' => 'Tapiceria', 'machine_name' => 'Prasa do formowania siedzisk', 'duration' => 8, 'changeover' => 20, 'description' => 'Wymiana formy, temperatura'],
            ['operation_name' => 'Montaż kolumny gazowej', 'department' => 'Montaż końcowy', 'machine_name' => 'Stanowisko montażowe obrotowe', 'duration' => 4, 'changeover' => 0, 'description' => 'Montaż mechanizmu podnoszenia'],
            ['operation_name' => 'Montaż mechanizmu tilt', 'department' => 'Montaż końcowy', 'machine_name' => 'Prasa montażowa hydrauliczna', 'duration' => 6, 'changeover' => 10, 'description' => 'Wciskanie łożysk, osi'],
            ['operation_name' => 'Skręcanie elementów', 'department' => 'Montaż końcowy', 'machine_name' => 'Wkrętarka elektryczna z programatorem', 'duration' => 10, 'changeover' => 5, 'description' => 'Zmiana programu momentu dokręcania'],
            ['operation_name' => 'Test szczelności i funkcjonalności', 'department' => 'Kontrola jakości', 'machine_name' => 'System podsłuchu (testy)', 'duration' => 5, 'changeover' => 0, 'description' => 'Test ciśnienia w kolumnie, blokad'],
            ['operation_name' => 'Waga końcowa i kontrola wizualna', 'department' => 'Kontrola jakości', 'machine_name' => 'Cyfrowa waga platformowa', 'duration' => 2, 'changeover' => 0, 'description' => 'Pomiar masy, odbiór jakościowy'],
            ['operation_name' => 'Pakowanie do kartonu', 'department' => 'Pakowanie', 'machine_name' => 'Automatyczna wiązarka kartonów', 'duration' => 7, 'changeover' => 10, 'description' => 'Zmiana formatu kartonu'],
            ['operation_name' => 'Etykietowanie logistyczne', 'department' => 'Pakowanie', 'machine_name' => 'Aplikator etykiet logistycznych', 'duration' => 2, 'changeover' => 5, 'description' => 'Zmiana wzoru etykiety'],
            ['operation_name' => 'Owijanie palety', 'department' => 'Pakowanie', 'machine_name' => 'Owijarka do palet ze stretch', 'duration' => 3, 'changeover' => 0, 'description' => 'Per 4 krzesła na palecie (3 min/szt)'],
        ];

        foreach ($rows as $r) {
            // find machine by exact name or by model fallback
            $machine = Machines::where('name', $r['machine_name'])->first();
            if (!$machine) {
                $machine = Machines::where('model', 'like', "%{$r['machine_name']}%")
                    ->orWhere('name', 'like', "%{$r['machine_name']}%")
                    ->first();
            }

            $barcode = null;
            if ($machine && !empty($machine->barcode)) {
                $barcode = $machine->barcode;
            } else {
                // generate simple barcode-like token from model
                $raw = $machine->model ?? $r['machine_name'];
                $trans = @iconv('UTF-8', 'ASCII//TRANSLIT', $raw) ?: $raw;
                $barcode = preg_replace('/[^A-Z0-9]/i', '', strtoupper($trans));
                $barcode = substr($barcode, 0, 13);
                if (strlen($barcode) < 6) {
                    $barcode = strtoupper(substr(md5($raw), 0, 13));
                }
            }

            DB::table('operationmachines')->insert([
                'barcode' => $barcode,
                'machine_id' => $machine ? $machine->id : null,
                'operation_name' => $r['operation_name'],
                'description' => $r['description'] ?? null,
                'changeover_time' => $r['changeover'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        echo "\nInserted " . count($rows) . " operationmachine records.\n";
    }
}
