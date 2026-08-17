<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SearchService
{
    /**
     * Common Phonetic / Typo / Transliteration Dictionary
     */
    protected array $synonymMap = [
        'chai' => ['chai', 'tea', 'chay', 'chaai', 'चाय', 'masala tea', 'hot tea'],
        'tea' => ['chai', 'tea', 'chay', 'chaai', 'चाय'],
        'chay' => ['chai', 'tea', 'chay', 'चाय'],
        'चाय' => ['chai', 'tea', 'chay', 'chaai', 'चाय'],
        'samosa' => ['samosa', 'somosa', 'samosaa', 'समौसा', 'समोसा'],
        'somosa' => ['samosa', 'somosa', 'samosaa', 'समोसा'],
        'समोसा' => ['samosa', 'somosa', 'samosaa', 'समोसा'],
        'burger' => ['burger', 'burgar', 'burgr', 'burgur', 'बर्गर', 'veg burger', 'chicken burger'],
        'burgar' => ['burger', 'burgar', 'burgr', 'बर्गर'],
        'बर्गर' => ['burger', 'burgar', 'burgr', 'बर्गर'],
        'pizza' => ['pizza', 'piza', 'pijja', 'पिज़्ज़ा', 'पिज़्ज़ा', 'पिज्जा'],
        'piza' => ['pizza', 'piza', 'पिज़्ज़ा'],
        'पिज्जा' => ['pizza', 'piza', 'पिज़्ज़ा'],
        'biryani' => ['biryani', 'biryany', 'biriyani', 'biryanee', 'बिरयानी', 'chicken biryani', 'dum biryani'],
        'biriyani' => ['biryani', 'biriyani', 'बिरयानी'],
        'बिरयानी' => ['biryani', 'biriyani', 'बिरयानी'],
        'cold drink' => ['coke', 'pepsi', 'sprite', 'cold drink', 'soft drink', 'thumbs up', 'कोल्ड ड्रिंक'],
        'nashta' => ['samosa', 'kachori', 'poha', 'jalebi', 'chaat', 'नाश्ता', 'breakfast'],
        'नाश्ता' => ['samosa', 'kachori', 'poha', 'jalebi', 'chaat', 'breakfast'],
        'jalebi' => ['jalebi', 'jalebee', 'jalebi', 'जलेबी', 'desi ghee jalebi'],
        'जलेबी' => ['jalebi', 'jalebee', 'जलेबी'],
        'paneer' => ['paneer', 'panir', 'पनीर', 'matar paneer', 'shahi paneer', 'butter paneer'],
        'पनीर' => ['paneer', 'panir', 'पनीर'],
        'chaat' => ['chaat', 'chat', 'चाट', 'matar chaat', 'golgappa'],
        'चाट' => ['chaat', 'chat', 'चाट'],
        'dosa' => ['dosa', 'dhosa', 'डोसा', 'masala dosa'],
        'डोसा' => ['dosa', 'dhosa', 'डोसा'],
        'momo' => ['momo', 'momos', 'मोमो', 'मोमोज', 'fried momos', 'veg momos'],
        'momos' => ['momo', 'momos', 'मोमो', 'मोमोज'],
        'मोमो' => ['momo', 'momos', 'मोमो', 'मोमोज'],
        'chowmein' => ['chowmein', 'noodles', 'chowmin', 'चाउमीन', 'नूडल्स'],
        'चाउमीन' => ['chowmein', 'noodles', 'chowmin', 'चाउमीन'],
    ];

    /**
     * Hindi / English Number Words for Quantity Intent Extraction
     */
    protected array $numberMap = [
        '1' => 1, 'one' => 1, 'ek' => 1, 'एक' => 1,
        '2' => 2, 'two' => 2, 'do' => 2, 'दो' => 2,
        '3' => 3, 'three' => 3, 'teen' => 3, 'तीन' => 3,
        '4' => 4, 'four' => 4, 'char' => 4, 'चार' => 4,
        '5' => 5, 'five' => 5, 'panch' => 5, 'पांच' => 5, 'पाँच' => 5,
        '6' => 6, 'six' => 6, 'chhah' => 6, 'छह' => 6,
        '10' => 10, 'ten' => 10, 'dus' => 10, 'दस' => 10,
    ];

    /**
     * Normalize Search Query
     */
    public function normalizeQuery(string $raw): string
    {
        $q = mb_strtolower(trim($raw), 'UTF-8');
        // Remove common fillers like "chahiye", "chahiye tha", "dena", "le aao", "order karna hai"
        $fillers = [
            'chahiye', 'chahiye tha', 'bhai', 'dena', 'le aao', 'lao', 'bhejo', 'order karna hai',
            'order karo', 'mangwana hai', 'khaoonga', 'khana hai', 'please', 'chahie', 'चाहिए', 'देना', 'लाओ',
        ];

        foreach ($fillers as $f) {
            $q = preg_replace('/\b' . preg_quote($f, '/') . '\b/u', '', $q);
        }

        // Collapse extra spaces
        return trim(preg_replace('/\s+/u', ' ', $q));
    }

    /**
     * Extract Intent (Quantity + Main Subject)
     * e.g. "2 chai" -> quantity: 2, itemQuery: "chai"
     * e.g. "दो समोसा" -> quantity: 2, itemQuery: "समोसा"
     */
    public function extractIntent(string $raw): array
    {
        $normalized = $this->normalizeQuery($raw);
        $tokens = explode(' ', $normalized);

        $quantity = null;
        $cleanTokens = [];

        foreach ($tokens as $token) {
            if (isset($this->numberMap[$token]) && $quantity === null) {
                $quantity = $this->numberMap[$token];
            } else {
                $cleanTokens[] = $token;
            }
        }

        $cleanQuery = implode(' ', $cleanTokens);
        if (empty($cleanQuery)) {
            $cleanQuery = $normalized;
        }

        return [
            'original_query' => $raw,
            'clean_query' => $cleanQuery,
            'quantity' => $quantity ?? 1,
            'has_quantity_intent' => $quantity !== null,
        ];
    }

    /**
     * Expand query with synonyms & transliterations
     */
    public function expandKeywords(string $cleanQuery): array
    {
        $keywords = [$cleanQuery];
        $words = explode(' ', $cleanQuery);

        foreach ($words as $word) {
            if (isset($this->synonymMap[$word])) {
                $keywords = array_merge($keywords, $this->synonymMap[$word]);
            }
        }

        // Substring checks in synonym map
        foreach ($this->synonymMap as $key => $syns) {
            if (str_contains($cleanQuery, $key) || str_contains($key, $cleanQuery)) {
                $keywords = array_merge($keywords, $syns);
            }
        }

        return array_values(array_unique(array_filter($keywords)));
    }

    /**
     * Perform Intelligent Search across Dishes and Restaurants
     */
    public function search(string $query, ?int $restaurantId = null, int $limit = 30): array
    {
        if (empty(trim($query))) {
            return [
                'intent' => ['original_query' => '', 'clean_query' => '', 'quantity' => 1, 'has_quantity_intent' => false],
                'dishes' => [],
                'restaurants' => [],
                'suggestions' => [],
            ];
        }

        $intent = $this->extractIntent($query);
        $expandedTerms = $this->expandKeywords($intent['clean_query']);

        // 1. Search Dishes (Available items first)
        $dishesQuery = MenuItem::query()
            ->with(['restaurant', 'category'])
            ->where(function (Builder $builder) use ($expandedTerms, $intent) {
                foreach ($expandedTerms as $term) {
                    $builder->orWhere('name', 'like', "%{$term}%")
                        ->orWhere('description', 'like', "%{$term}%");
                }
            });

        if ($restaurantId) {
            $dishesQuery->where('restaurant_id', $restaurantId);
        }

        $dishes = $dishesQuery
            ->orderByDesc('is_available')
            ->orderByDesc('is_recommended')
            ->limit($limit)
            ->get();

        // 2. Search Restaurants
        $restaurants = collect();
        if (! $restaurantId) {
            $restaurantsQuery = Restaurant::query()
                ->where('is_active', true)
                ->where(function (Builder $builder) use ($expandedTerms, $intent) {
                    foreach ($expandedTerms as $term) {
                        $builder->orWhere('name', 'like', "%{$term}%")
                            ->orWhere('description', 'like', "%{$term}%")
                            ->orWhere('address_line1', 'like', "%{$term}%")
                            ->orWhere('city', 'like', "%{$term}%");
                    }
                });

            $restaurants = $restaurantsQuery->limit(8)->get();
        }

        // 3. Generate Search Suggestions based on real database products
        $suggestions = MenuItem::query()
            ->where('is_available', true)
            ->where(function (Builder $b) use ($expandedTerms) {
                foreach ($expandedTerms as $t) {
                    $b->orWhere('name', 'like', "%{$t}%");
                }
            })
            ->limit(6)
            ->pluck('name')
            ->unique()
            ->values();

        return [
            'intent' => $intent,
            'dishes' => $dishes,
            'restaurants' => $restaurants,
            'suggestions' => $suggestions,
        ];
    }

    /**
     * Get Quick Typehead Suggestions
     */
    public function getSuggestions(string $partial): Collection
    {
        if (empty(trim($partial))) {
            return collect([
                'Chai', 'Samosa', 'Burger', 'Biryani', 'Pizza', 'Jalebi', 'Paneer Butter Masala',
            ]);
        }

        $intent = $this->extractIntent($partial);
        $terms = $this->expandKeywords($intent['clean_query']);

        return MenuItem::query()
            ->where('is_available', true)
            ->where(function (Builder $b) use ($terms) {
                foreach ($terms as $t) {
                    $b->orWhere('name', 'like', "%{$t}%");
                }
            })
            ->limit(8)
            ->pluck('name')
            ->unique()
            ->values();
    }
}
