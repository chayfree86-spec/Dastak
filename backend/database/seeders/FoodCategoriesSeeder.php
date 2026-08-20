<?php

namespace Database\Seeders;

use App\Models\FoodCategory;
use Illuminate\Database\Seeder;

class FoodCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'All Food', 'slug' => 'all', 'search_query' => 'food', 'sort_order' => 0, 'image' => 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120&auto=format&fit=crop&q=70'],
            ['name' => 'Biryani', 'slug' => 'biryani', 'search_query' => 'biryani', 'sort_order' => 1, 'image' => 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&auto=format&fit=crop&q=70'],
            ['name' => 'Chai & Snacks', 'slug' => 'chai-snacks', 'search_query' => 'chai', 'sort_order' => 2, 'image' => 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=120&auto=format&fit=crop&q=70'],
            ['name' => 'Burgers & Rolls', 'slug' => 'burgers-rolls', 'search_query' => 'burger', 'sort_order' => 3, 'image' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=70'],
            ['name' => 'Pure Veg', 'slug' => 'pure-veg', 'search_query' => 'paneer', 'sort_order' => 4, 'image' => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&auto=format&fit=crop&q=70'],
            ['name' => 'Desserts & Sweets', 'slug' => 'desserts-sweets', 'search_query' => 'jalebi', 'sort_order' => 5, 'image' => 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=120&auto=format&fit=crop&q=70'],
        ];

        foreach ($categories as $c) {
            FoodCategory::updateOrCreate(['slug' => $c['slug']], array_merge($c, ['is_active' => true]));
        }
    }
}
