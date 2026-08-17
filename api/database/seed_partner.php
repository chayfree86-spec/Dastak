<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Role;
use App\Models\Restaurant;
use App\Enums\AccountStatus;
use Illuminate\Support\Facades\Hash;

$user = User::firstOrNew(['mobile' => '9628717175']);
$user->name = 'Chay Chaupal';
$user->email = 'chaychaupal@dastak.in';
$user->password = Hash::make('2310');
$user->login_pin = Hash::make('2310');
$user->status = AccountStatus::ACTIVE;
$user->save();

$role = Role::firstOrCreate(['slug' => 'restaurant_owner'], ['name' => 'Restaurant Owner']);
if (!$user->roles()->where('slug', 'restaurant_owner')->exists()) {
    $user->roles()->syncWithoutDetaching([$role->id]);
}

$restaurant = Restaurant::where('name', 'like', '%Chay Chaupal%')->first();
if (!$restaurant) {
    $restaurant = Restaurant::first();
}
if (!$restaurant) {
    $restaurant = new Restaurant();
    $restaurant->slug = 'chay-chaupal';
}
$restaurant->name = 'Chay Chaupal';
$restaurant->owner_id = $user->id;
$restaurant->is_active = true;
$restaurant->is_open = true;
$restaurant->phone = '9628717175';
$restaurant->email = 'chaychaupal@dastak.in';
$restaurant->save();

echo "SUCCESS: User '{$user->name}' (Mobile: {$user->mobile}, PIN: 2310) linked to Restaurant '{$restaurant->name}' (ID: {$restaurant->id})\n";
