<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\SystemSetting;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Backs the admin Settings screen (src/pages/settings/SettingsPage.jsx) under
 * /admin/settings. Platform settings persist to database table `system_settings`.
 * Service areas are backed by Zone model.
 */
class SettingsController extends Controller
{
    public function getSettings(): JsonResponse
    {
        return ApiResponse::success($this->all(), 'Platform settings retrieved.');
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $payload = $request->except(['_token']);
        SystemSetting::setMany($payload);

        return ApiResponse::success($this->all(), 'Platform settings updated successfully.');
    }

    public function getOrderSettings(): JsonResponse
    {
        return ApiResponse::success($this->only(['cancel_window_mins', 'auto_accept']), 'Order settings retrieved.');
    }

    public function updateOrderSettings(Request $request): JsonResponse
    {
        return $this->patchStore($request, 'Order settings updated.');
    }

    public function getDeliverySettings(): JsonResponse
    {
        return ApiResponse::success($this->only(['dispatch_mode', 'max_radius_km', 'base_delivery_fee']), 'Delivery settings retrieved.');
    }

    public function updateDeliverySettings(Request $request): JsonResponse
    {
        return $this->patchStore($request, 'Delivery settings updated.');
    }

    public function getPaymentSettings(): JsonResponse
    {
        return ApiResponse::success($this->only(['cod_enabled', 'online_gateway']), 'Payment settings retrieved.');
    }

    public function updatePaymentSettings(Request $request): JsonResponse
    {
        return $this->patchStore($request, 'Payment settings updated.');
    }

    public function getNotificationSettings(): JsonResponse
    {
        return ApiResponse::success($this->only(['notify_sms', 'notify_push', 'notify_email']), 'Notification settings retrieved.');
    }

    public function updateNotificationSettings(Request $request): JsonResponse
    {
        return $this->patchStore($request, 'Notification settings updated.');
    }

    // --- Service areas (backed by Zone) ---

    public function getServiceAreas(): JsonResponse
    {
        $areas = Zone::withCount('restaurants')->orderBy('name')->get()->map(fn ($z) => [
            'id' => $z->id,
            'name' => $z->name,
            'city' => $z->city,
            'center_latitude' => $z->center_latitude !== null ? (float) $z->center_latitude : null,
            'center_longitude' => $z->center_longitude !== null ? (float) $z->center_longitude : null,
            'radius_km' => (float) $z->radius_km,
            'restaurants_count' => (int) $z->restaurants_count,
            'is_active' => (bool) $z->is_active,
        ])->values();

        return ApiResponse::success($areas, 'Service areas retrieved.');
    }

    public function createServiceArea(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'city' => ['nullable', 'string', 'max:100'],
            'center_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'center_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'radius_km' => ['nullable', 'numeric', 'min:0.5', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $name = trim($data['name']);
        $city = trim($data['city'] ?? 'Kanpur');

        $exists = Zone::whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->whereRaw('LOWER(city) = ?', [strtolower($city)])
            ->exists();

        if ($exists) {
            return ApiResponse::error("A service area with the name '{$name}' in '{$city}' already exists.", null, 422);
        }

        $zone = Zone::create([
            'name' => $name,
            'city' => $city,
            'center_latitude' => $data['center_latitude'] ?? 26.4499,
            'center_longitude' => $data['center_longitude'] ?? 80.3319,
            'radius_km' => $data['radius_km'] ?? (float) config('dastak.delivery.max_radius_km', 12),
            'is_active' => $data['is_active'] ?? true,
        ]);

        return ApiResponse::success([
            'id' => $zone->id,
            'name' => $zone->name,
            'city' => $zone->city,
            'center_latitude' => $zone->center_latitude !== null ? (float) $zone->center_latitude : null,
            'center_longitude' => $zone->center_longitude !== null ? (float) $zone->center_longitude : null,
            'radius_km' => (float) $zone->radius_km,
            'restaurants_count' => 0,
            'is_active' => (bool) $zone->is_active,
        ], 'Service area created.', 201);
    }

    public function updateServiceArea(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'city' => ['nullable', 'string', 'max:100'],
            'center_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'center_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'radius_km' => ['nullable', 'numeric', 'min:0.5', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $zone = Zone::findOrFail($id);

        if (!empty($data['name'])) {
            $name = trim($data['name']);
            $city = trim($data['city'] ?? $zone->city);

            $exists = Zone::where('id', '!=', $id)
                ->whereRaw('LOWER(name) = ?', [strtolower($name)])
                ->whereRaw('LOWER(city) = ?', [strtolower($city)])
                ->exists();

            if ($exists) {
                return ApiResponse::error("A service area with the name '{$name}' in '{$city}' already exists.", null, 422);
            }
        }

        $zone->update($data);

        return ApiResponse::success([
            'id' => $zone->id,
            'name' => $zone->name,
            'city' => $zone->city,
            'center_latitude' => $zone->center_latitude !== null ? (float) $zone->center_latitude : null,
            'center_longitude' => $zone->center_longitude !== null ? (float) $zone->center_longitude : null,
            'radius_km' => (float) $zone->radius_km,
            'restaurants_count' => (int) $zone->restaurants()->count(),
            'is_active' => (bool) $zone->is_active,
        ], 'Service area updated.');
    }

    public function deleteServiceArea(int $id): JsonResponse
    {
        $zone = Zone::findOrFail($id);
        $zone->delete();

        return ApiResponse::success(null, 'Service area deleted.');
    }

    // --- store helpers ---

    protected function defaults(): array
    {
        return [
            'app_name' => 'Dastak',
            'tagline' => 'Jo Chahiye, Ghar Par',
            'support_phone' => '1800-123-4567',
            'support_email' => 'support@dastakdelivery.com',
            'cancel_window_mins' => 5,
            'auto_accept' => false,
            'dispatch_mode' => 'AUTO',
            'max_radius_km' => 12,
            'base_delivery_fee' => 35,
            'cod_enabled' => true,
            'online_gateway' => 'RAZORPAY',
            'default_commission' => 15,
            'notify_sms' => true,
            'notify_push' => true,
            'notify_email' => false,
        ];
    }

    protected function all(): array
    {
        $stored = SystemSetting::getAllSettings();
        return array_merge($this->defaults(), $stored);
    }

    protected function only(array $keys): array
    {
        return array_intersect_key($this->all(), array_flip($keys));
    }

    protected function patchStore(Request $request, string $message): JsonResponse
    {
        $payload = $request->except(['_token']);
        SystemSetting::setMany($payload);

        return ApiResponse::success($this->all(), $message);
    }
}
