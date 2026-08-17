<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\RestaurantBankAccount;
use App\Models\RestaurantOperatingHour;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class RestaurantService
{
    public function listNearbyRestaurants(?float $latitude = null, ?float $longitude = null, array $filters = [], int $radiusKm = 12, int $perPage = 15): LengthAwarePaginator
    {
        $query = Restaurant::query()
            ->with(['zone', 'operatingHours'])
            ->where('is_active', true);

        // Calculate distance if coordinates provided
        if ($latitude !== null && $longitude !== null) {
            $query->withDistance($latitude, $longitude)
                ->having('distance', '<=', $radiusKm)
                ->orderBy('distance', 'asc');
        } else {
            $query->latest();
        }

        // Filter by Pure Veg
        if (! empty($filters['is_pure_veg'])) {
            $query->where('is_pure_veg', true);
        }

        // Filter by Open Status
        if (isset($filters['is_open'])) {
            $query->where('is_open', (bool) $filters['is_open']);
        }

        // Search by restaurant name
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->paginate($perPage);
    }

    public function listAdminRestaurants(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Restaurant::with(['owner', 'zone', 'bankAccount'])->latest();

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('city', 'like', "%{$search}%");
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        if (isset($filters['is_open'])) {
            $query->where('is_open', (bool) $filters['is_open']);
        }

        if (! empty($filters['zone_id'])) {
            $query->where('zone_id', $filters['zone_id']);
        }

        return $query->paginate($perPage);
    }

    public function getRestaurantBySlug(string $slug): Restaurant
    {
        // 1. Try exact slug match
        $restaurant = Restaurant::with(['zone', 'operatingHours', 'owner'])
            ->where('slug', $slug)
            ->first();

        // 2. Try prefix or partial slug match if not found
        if (!$restaurant) {
            $parts = explode('-', $slug);
            $prefix = count($parts) > 1 ? implode('-', array_slice($parts, 0, -1)) : $slug;
            $restaurant = Restaurant::with(['zone', 'operatingHours', 'owner'])
                ->where('slug', 'LIKE', "{$prefix}%")
                ->orWhere('name', 'LIKE', "%{$prefix}%")
                ->first();
        }

        // 3. Fallback by ID if slug is numeric
        if (!$restaurant && is_numeric($slug)) {
            $restaurant = Restaurant::with(['zone', 'operatingHours', 'owner'])->find($slug);
        }

        if (!$restaurant) {
            abort(404, 'Restaurant not found.');
        }

        return $restaurant;
    }

    public function createRestaurant(User $owner, array $data): Restaurant
    {
        return DB::transaction(function () use ($owner, $data) {
            $data['owner_id'] = $owner->id;
            $restaurant = Restaurant::create($data);

            // Create default operating hours (7 days a week, 09:00 - 23:00)
            for ($day = 0; $day <= 6; $day++) {
                RestaurantOperatingHour::create([
                    'restaurant_id' => $restaurant->id,
                    'day_of_week' => $day,
                    'opening_time' => '09:00:00',
                    'closing_time' => '23:00:00',
                    'is_closed' => false,
                ]);
            }

            return $restaurant->fresh(['operatingHours', 'zone']);
        });
    }

    public function updateRestaurant(Restaurant $restaurant, array $data): Restaurant
    {
        $restaurant->update($data);
        return $restaurant->fresh(['operatingHours', 'zone', 'bankAccount']);
    }

    public function toggleOpenStatus(Restaurant $restaurant, bool $isOpen): Restaurant
    {
        $restaurant->update(['is_open' => $isOpen]);
        return $restaurant->fresh();
    }

    public function updateOperatingHours(Restaurant $restaurant, array $hoursList): void
    {
        DB::transaction(function () use ($restaurant, $hoursList) {
            foreach ($hoursList as $hour) {
                RestaurantOperatingHour::updateOrCreate(
                    [
                        'restaurant_id' => $restaurant->id,
                        'day_of_week' => $hour['day_of_week'],
                    ],
                    [
                        'opening_time' => $hour['opening_time'],
                        'closing_time' => $hour['closing_time'],
                        'is_closed' => $hour['is_closed'] ?? false,
                    ]
                );
            }
        });
    }

    public function updateBankAccount(Restaurant $restaurant, array $bankData): RestaurantBankAccount
    {
        return RestaurantBankAccount::updateOrCreate(
            ['restaurant_id' => $restaurant->id],
            $bankData
        );
    }

    public function updateRestaurantStatus(Restaurant $restaurant, bool $isActive): Restaurant
    {
        $restaurant->update(['is_active' => $isActive]);
        return $restaurant->fresh();
    }
}
