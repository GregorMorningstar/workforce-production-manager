<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ItemsFinishedGood;
use Illuminate\Support\Facades\File;

class ItemsFinishedGoodSeeder extends Seeder
{
    public function run()
    {
        // Use the public disk path directly to avoid broken/missing public/storage symlink issues.
        $imageDir = storage_path('app/public/image');
        File::ensureDirectoryExists($imageDir);

        // Find existing images in the folder
        $existing = glob($imageDir . '/*.{jpg,jpeg,png,gif}', GLOB_BRACE);

        // If no images found, download one example image and save it
        if (empty($existing)) {
            try {
                $url = 'https://picsum.photos/600/400';
                $contents = @file_get_contents($url);
                if ($contents !== false) {
                    $filename = 'example_product.jpg';
                    file_put_contents($imageDir . DIRECTORY_SEPARATOR . $filename, $contents);
                    $existing = [$imageDir . DIRECTORY_SEPARATOR . $filename];
                }
            } catch (\Throwable $e) {
                // ignore download errors; products will have null image_path
            }
        }

        $imagesCount = count($existing);

        $items = ItemsFinishedGood::factory()->count(10)->make();

        foreach ($items as $index => $item) {
            // use existing image if available
            if ($imagesCount > 0) {
                $path = $existing[$index % $imagesCount];
                $item->image_path = 'storage/image/' . basename($path);
            }

            // Do not randomize production time in seeders — start at 0 (will be recalculated when schema steps exist)
            $item->time_of_production = 0;

            $item->save();
        }
    }
}
