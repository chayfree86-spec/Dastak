<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MenuItem;
use App\Models\Restaurant;

$restaurant = Restaurant::where('name', 'like', '%Chay Chaupal%')->first();
if (!$restaurant) {
    echo "No Chay Chaupal found\n";
    exit;
}

$items = MenuItem::where('restaurant_id', $restaurant->id)->get();
echo "Total Items for {$restaurant->name} (ID: {$restaurant->id}): " . $items->count() . "\n";
foreach ($items as $it) {
    if ($it->base_price <= 0) {
        if (str_contains($it->name, 'Chai') || str_contains($it->name, 'Tea')) $it->base_price = 25;
        elseif (str_contains($it->name, 'Jalebi')) $it->base_price = 140;
        elseif (str_contains($it->name, 'Chaat') || str_contains($it->name, 'Batash')) $it->base_price = 60;
        elseif (str_contains($it->name, 'सैंडविच') || str_contains($it->name, 'Sandwich')) $it->base_price = 80;
        else $it->base_price = 50;
        $it->save();
        echo "  --> Updated '{$it->name}' base_price to ₹{$it->base_price}\n";
    } else {
        echo "  - '{$it->name}' base_price is ₹{$it->base_price}\n";
    }
}
