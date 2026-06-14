<?php

namespace Database\Seeders;

use App\Models\Machines;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MachineImagesSeeder extends Seeder
{
    /**
     * Seed machine images from internet sources.
     */
    public function run(): void
    {
        $machines = Machines::all();

        if ($machines->isEmpty()) {
            $this->command->info('No machines found.');
            return;
        }

        $this->command->info("Generating matched images for {$machines->count()} machines...");

        foreach ($machines as $machine) {
            try {
                $this->downloadAndSaveMachineImage($machine);
                $this->command->info("✓ Updated image for: {$machine->name}");
            } catch (\Exception $e) {
                $this->command->warn("✗ Failed to download image for {$machine->name}: {$e->getMessage()}");
            }
        }

        $this->command->info('Machine images seeding completed.');
    }

    private function downloadAndSaveMachineImage(Machines $machine): void
    {
        $searchTags = $this->getSearchTagsForMachine($machine->name ?? 'industrial machine');
        $imageUrls = [];

        foreach ($searchTags as $tag) {
            $tagPath = Str::lower($tag);
            $imageUrls[] = "https://loremflickr.com/640/480/industrial,{$tagPath}?lock={$machine->id}";
        }

        // Stable generic fallback if category sources fail.
        $imageUrls[] = "https://picsum.photos/seed/" . urlencode((string) $machine->id) . "/640/480";

        $imageContent = null;
        $attemptedUrl = null;

        foreach ($imageUrls as $url) {
            try {
                $attemptedUrl = $url;
                $context = stream_context_create([
                    'http' => [
                        'timeout' => 10,
                        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'follow_location' => 1,
                    ],
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false,
                    ]
                ]);
                
                $imageContent = @file_get_contents($url, false, $context);

                // Accept only real image payloads.
                if ($imageContent && strlen($imageContent) > 1000 && @getimagesizefromstring($imageContent) !== false) {
                    break;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        if (!$imageContent || strlen($imageContent) < 1000 || @getimagesizefromstring($imageContent) === false) {
            $imageContent = $this->buildSvgFallback($machine->name ?? 'Maszyna');
        }

        if (!empty($machine->image_path) && Storage::disk('public')->exists($machine->image_path)) {
            Storage::disk('public')->delete($machine->image_path);
        }

        // Generate unique filename
        $extension = $this->getImageExtension($imageContent);
        $filename = 'machines/' . $machine->id . '_' . Str::slug($machine->name ?? 'machine') . '_' . uniqid() . '.' . $extension;

        // Save image to storage/app/public/machines/
        Storage::disk('public')->put($filename, $imageContent);

        // Update machine with image path (relative to public storage)
        $machine->update(['image_path' => $filename]);
    }

    private function getSearchTagsForMachine(string $machineName): array
    {
        $name = Str::lower($machineName);

        // Precise mappings for machine names used in this project.
        $exactRules = [
            'piec indukcyjny' => ['furnace', 'metal', 'factory'],
            'kokila' => ['foundry', 'casting', 'metal'],
            'centrum obrobcze cnc' => ['cnc', 'machining', 'metal'],
            'tokarka cnc' => ['lathe', 'cnc', 'metal'],
            'pila tasmowa' => ['saw', 'metal', 'factory'],
            'kabina lakiernicza' => ['paint', 'industry', 'factory'],
            'piec tunelowy' => ['furnace', 'factory', 'heat'],
            'pistolet natryskowy' => ['spray', 'paint', 'industry'],
            'robot spawalniczy' => ['welding', 'robot', 'factory'],
            'spawarka' => ['welding', 'metal', 'factory'],
            'stol spawalniczy' => ['welding', 'metal', 'workshop'],
            'maszyna do szycia' => ['sewing', 'machine', 'factory'],
            'noz do ciecia' => ['cutting', 'machine', 'factory'],
            'prasa' => ['press', 'hydraulic', 'industry'],
            'stanowisko montazowe' => ['assembly', 'factory', 'automation'],
            'wkretarka' => ['tool', 'assembly', 'factory'],
            'tester wytrzymalosciowy' => ['testing', 'lab', 'industry'],
            'waga platformowa' => ['scale', 'warehouse', 'logistics'],
            'suwmiarka' => ['measurement', 'tool', 'metal'],
            'wiazarka kartonow' => ['packaging', 'box', 'factory'],
            'aplikator etykiet' => ['label', 'packaging', 'logistics'],
            'owijarka do palet' => ['pallet', 'packaging', 'warehouse'],
        ];

        $normalizedName = Str::ascii($name);
        foreach ($exactRules as $needle => $tags) {
            if (str_contains($normalizedName, $needle)) {
                return $tags;
            }
        }

        if (str_contains($name, 'cnc') || str_contains($name, 'tokarka') || str_contains($name, 'obr')) {
            return ['cnc', 'lathe', 'machining'];
        }

        if (str_contains($name, 'piec') || str_contains($name, 'tunel')) {
            return ['furnace', 'heat', 'factory'];
        }

        if (str_contains($name, 'spaw') || str_contains($name, 'mig') || str_contains($name, 'mag')) {
            return ['welding', 'metal', 'factory'];
        }

        if (str_contains($name, 'pi') && str_contains($name, 'ta')) {
            return ['saw', 'cutting', 'metal'];
        }

        if (str_contains($name, 'lakier') || str_contains($name, 'natrysk')) {
            return ['paint', 'spray', 'industry'];
        }

        if (str_contains($name, 'prasa')) {
            return ['press', 'hydraulic', 'industry'];
        }

        if (str_contains($name, 'szy')) {
            return ['sewing', 'machine', 'factory'];
        }

        if (str_contains($name, 'wkr')) {
            return ['tool', 'assembly', 'factory'];
        }

        if (str_contains($name, 'tester') || str_contains($name, 'waga') || str_contains($name, 'suwmiarka')) {
            return ['testing', 'measurement', 'lab'];
        }

        if (str_contains($name, 'owijarka') || str_contains($name, 'wia') || str_contains($name, 'etykiet')) {
            return ['packaging', 'warehouse', 'logistics'];
        }

        return ['industrial', 'machine', 'factory'];
    }

    private function buildSvgFallback(string $machineName): string
    {
        $safeName = htmlspecialchars(Str::limit($machineName, 40, '...'), ENT_QUOTES, 'UTF-8');

        return "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480'>"
            . "<defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>"
            . "<stop offset='0%' stop-color='#1f2937'/><stop offset='100%' stop-color='#4b5563'/></linearGradient></defs>"
            . "<rect width='640' height='480' fill='url(#g)'/>"
            . "<rect x='24' y='24' width='592' height='432' rx='14' fill='none' stroke='#9ca3af' stroke-width='2'/>"
            . "<text x='320' y='220' text-anchor='middle' fill='#f9fafb' font-family='Arial, sans-serif' font-size='30' font-weight='700'>MASZYNA</text>"
            . "<text x='320' y='270' text-anchor='middle' fill='#e5e7eb' font-family='Arial, sans-serif' font-size='24'>{$safeName}</text>"
            . "</svg>";
    }

    private function getImageExtension($imageContent): string
    {
        if (str_starts_with($imageContent, '<svg')) {
            return 'svg';
        }

        // Detect image type from file signature
        if (str_starts_with($imageContent, "\xFF\xD8\xFF")) {
            return 'jpg';
        } elseif (str_starts_with($imageContent, "\x89PNG")) {
            return 'png';
        } elseif (str_starts_with($imageContent, "GIF8")) {
            return 'gif';
        } elseif (str_starts_with($imageContent, "RIFF") && str_contains($imageContent, "WEBP")) {
            return 'webp';
        }
        return 'jpg'; // Default fallback
    }
}
