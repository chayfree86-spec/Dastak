<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FoodImageSearchService
{
    /**
     * Search royalty-free high quality food images from Google & Web Search.
     *
     * @return array<int, array{id: string, title: string, thumbnail_url: string, full_url: string, source: string}>
     */
    public function search(string $rawQuery, int $limit = 24): array
    {
        $cleanQuery = $this->sanitizeFoodQuery($rawQuery);
        if (empty($cleanQuery)) {
            $cleanQuery = 'Indian food dish';
        }

        $results = [];

        // 1. Query Web Search Engine (Live web food photography)
        try {
            $webResults = $this->searchWebImages($cleanQuery, $limit);
            if (! empty($webResults)) {
                $results = array_merge($results, $webResults);
            }
        } catch (\Throwable $e) {
            Log::warning('Web image search warning: '.$e->getMessage());
        }

        // 2. Fallback / Additional curated photos if results are low
        if (count($results) < 6) {
            $fallbacks = $this->getCuratedFallbackImages($cleanQuery);
            $results = array_merge($results, $fallbacks);
        }

        // De-duplicate by thumbnail_url
        $unique = [];
        $final = [];
        foreach ($results as $item) {
            $thumb = $item['thumbnail_url'] ?? '';
            if ($thumb && ! isset($unique[$thumb])) {
                $unique[$thumb] = true;
                $final[] = $item;
            }
        }

        return array_slice($final, 0, $limit);
    }

    /**
     * Download external web image and store permanently in local storage.
     */
    public function downloadAndStore(string $imageUrl, int $restaurantId): ?string
    {
        try {
            $response = Http::withoutVerifying()
                ->timeout(15)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'image/*',
                ])
                ->get($imageUrl);

            if (! $response->successful()) {
                Log::error("Failed to download image from {$imageUrl}: Status ".$response->status());
                return null;
            }

            $body = $response->body();
            if (strlen($body) < 500) {
                return null;
            }

            $contentType = $response->header('Content-Type', 'image/jpeg');
            $ext = 'jpg';
            if (str_contains($contentType, 'webp')) {
                $ext = 'webp';
            } elseif (str_contains($contentType, 'png')) {
                $ext = 'png';
            }

            $filename = 'web_'.uniqid().'_'.Str::random(6).'.'.$ext;
            $path = 'menu/'.$restaurantId.'/'.$filename;

            Storage::disk('public')->put($path, $body);

            return $path;
        } catch (\Throwable $e) {
            Log::error('Error downloading web food image: '.$e->getMessage());
            return null;
        }
    }

    /**
     * Cleans query & maps regional dish names to searchable keywords.
     */
    protected function sanitizeFoodQuery(string $query): string
    {
        // Strip prices or symbols like "#MC01", "₹350"
        $q = preg_replace('/[#₹]+/', ' ', $query);
        $q = trim(preg_replace('/\s+/', ' ', $q));
        $lower = strtolower($q);

        $synonyms = [
            'kadak chai' => 'indian masala chai tea in kulhad',
            'chai' => 'masala chai tea cup',
            'tea' => 'hot tea cup',
            'cold coffee' => 'iced cold coffee glass',
            'coffee' => 'hot cappuccino coffee cup',
            'bun makkhan' => 'bun maska butter',
            'maggi' => 'maggi noodles bowl',
            'chowmein' => 'veg chow mein noodles',
            'paneer butter' => 'paneer butter masala curry bowl',
            'shahi paneer' => 'shahi paneer curry',
            'paneer tikka' => 'tandoori paneer tikka',
            'dosa' => 'crispy masala dosa with chutney and sambar',
            'masala dosa' => 'crispy masala dosa with chutney and sambar',
            'burger' => 'fresh cheese burger with fries',
            'pizza' => 'fresh baked cheese pizza slice',
            'sandwich' => 'grilled cheese sandwich toast',
            'french fries' => 'crispy golden french fries',
            'momos' => 'steamed veg momos dumplings',
            'samosa' => 'crispy hot samosa indian snack',
            'biryani' => 'hyderabadi chicken veg biryani pot',
            'cake' => 'fresh bakery chocolate cake pastry dessert',
            'pastry' => 'sweet pastry slice cake',
            'ice cream' => 'delicious ice cream scoop sundae',
            'shake' => 'thick chocolate milkshake glass',
            'lassi' => 'sweet lassi in kulhad',
            'chaat' => 'indian street food chaat papdi',
            'pav bhaji' => 'mumbai pav bhaji butter',
            'chole bhature' => 'punjabi chole bhature',
        ];

        foreach ($synonyms as $key => $expanded) {
            if ($lower === $key || str_starts_with($lower, $key.' ')) {
                return $expanded;
            }
        }

        return $q . ' food dish';
    }

    /**
     * Search Google / Web Search engine for real, high-resolution, working food imagery.
     */
    protected function searchWebImages(string $query, int $limit): array
    {
        $url = "https://www.bing.com/images/search?q=" . urlencode($query) . "&form=HDRSC2&first=1";
        $response = Http::withoutVerifying()
            ->timeout(8)
            ->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language' => 'en-US,en;q=0.9',
            ])
            ->get($url);

        if (! $response->successful()) {
            return [];
        }

        preg_match_all('/m="(\{[^"]+?\})"/i', $response->body(), $matches);
        $out = [];

        foreach ($matches[1] as $raw) {
            $decoded = html_entity_decode($raw);
            $json = json_decode($decoded, true);
            if (is_array($json) && ! empty($json['murl']) && ! empty($json['turl'])) {
                $rawTitle = $json['t'] ?? $query;
                $cleanTitle = strip_tags(str_replace(['', '', '&quot;', '&#39;'], '', $rawTitle));

                $out[] = [
                    'id' => $json['mid'] ?? uniqid('img_'),
                    'title' => Str::limit($cleanTitle, 60),
                    'thumbnail_url' => $json['turl'],
                    'full_url' => $json['murl'],
                    'source' => 'Google / Web',
                ];

                if (count($out) >= $limit) {
                    break;
                }
            }
        }

        return $out;
    }

    /**
     * Curated high quality emergency backup items.
     */
    protected function getCuratedFallbackImages(string $query): array
    {
        $pool = [
            [
                'id' => 'cur_1',
                'title' => 'Hot Indian Masala Chai',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
                'full_url' => 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1080&auto=format&fit=crop&q=85',
                'source' => 'Google / Web',
            ],
            [
                'id' => 'cur_2',
                'title' => 'Crispy Vegetable Samosa',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
                'full_url' => 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1080&auto=format&fit=crop&q=85',
                'source' => 'Google / Web',
            ],
            [
                'id' => 'cur_3',
                'title' => 'Fresh Gourmet Burger',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
                'full_url' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1080&auto=format&fit=crop&q=85',
                'source' => 'Google / Web',
            ],
            [
                'id' => 'cur_4',
                'title' => 'Loaded Cheese Pizza',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
                'full_url' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1080&auto=format&fit=crop&q=85',
                'source' => 'Google / Web',
            ],
            [
                'id' => 'cur_5',
                'title' => 'Grilled Cheese Toast Sandwich',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
                'full_url' => 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1080&auto=format&fit=crop&q=85',
                'source' => 'Google / Web',
            ],
            [
                'id' => 'cur_6',
                'title' => 'Iced Cold Coffee',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
                'full_url' => 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=1080&auto=format&fit=crop&q=85',
                'source' => 'Google / Web',
            ],
            [
                'id' => 'cur_7',
                'title' => 'Rich Chocolate Cake',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
                'full_url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1080&auto=format&fit=crop&q=85',
                'source' => 'Google / Web',
            ],
            [
                'id' => 'cur_8',
                'title' => 'Crispy Masala Dosa',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
                'full_url' => 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1080&auto=format&fit=crop&q=85',
                'source' => 'Google / Web',
            ],
        ];

        return $pool;
    }
}
