<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Backs the admin Settings screen (src/pages/settings/SettingsPage.jsx) under
 * /admin/settings. Platform settings persist to a JSON store (no settings table
 * yet); service areas are backed by the real Zone model.
 */
class SettingsController extends Controller
{
    protected string $store = 'platform_settings.json';

    public function getSettings(): JsonResponse
    {
        return ApiResponse::success($this->all(), 'Platform settings retrieved.');
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $merged = array_merge($this->all(), $request->all());
        $this->save($merged);

        return ApiResponse::success($merged, 'Platform settings updated successfully.');
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
        $areas = Zone::orderBy('name')->get()->map(fn ($z) => [
            'id' => $z->id,
            'name' => $z->name,
            'is_active' => (bool) $z->is_active,
        ])->values();

        return ApiResponse::success($areas, 'Service areas retrieved.');
    }

    public function createServiceArea(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $zone = Zone::create([
            'name' => $data['name'],
            'city' => $request->input('city', 'Kanpur'),
            'center_latitude' => $request->input('latitude', 26.4499),
            'center_longitude' => $request->input('longitude', 80.3319),
            'radius_km' => $request->input('radius_km', (int) config('dastak.delivery.max_radius_km', 12)),
            'is_active' => $data['is_active'] ?? true,
        ]);

        return ApiResponse::success(['id' => $zone->id, 'name' => $zone->name, 'is_active' => (bool) $zone->is_active], 'Service area created.', 201);
    }

    public function updateServiceArea(Request $request, int $id): JsonResponse
    {
        $zone = Zone::findOrFail($id);
        $zone->update($request->only(['name', 'is_active', 'city', 'radius_km']));

        return ApiResponse::success(['id' => $zone->id, 'name' => $zone->name, 'is_active' => (bool) $zone->is_active], 'Service area updated.');
    }

    public function deleteServiceArea(int $id): JsonResponse
    {
        Zone::findOrFail($id)->delete();

        return ApiResponse::success(null, 'Service area deleted.');
    }

    // --- store helpers ---

    protected function defaults(): array
    {
        return [
            'app_name' => config('dastak.name', 'Dastak'),
            'tagline' => config('dastak.tagline', 'Jo Chahiye, Ghar Par'),
            'support_phone' => '1800-123-4567',
            'support_email' => 'support@dastakdelivery.com',
            'cancel_window_mins' => (int) config('dastak.orders.cancel_window_minutes', 5),
            'auto_accept' => false,
            'dispatch_mode' => config('dastak.delivery.default_dispatch_mode', 'AUTO'),
            'max_radius_km' => (int) config('dastak.delivery.max_radius_km', 12),
            'base_delivery_fee' => (float) config('dastak.delivery.base_fee', 35),
            'cod_enabled' => (bool) config('dastak.payments.cod_enabled', true),
            'online_gateway' => strtoupper((string) config('dastak.payments.default_gateway', 'razorpay')),
            'default_commission' => (float) config('dastak.commission.default_percentage', 15),
            'notify_sms' => true,
            'notify_push' => true,
            'notify_email' => false,
        ];
    }

    protected function all(): array
    {
        $stored = [];
        if (Storage::exists($this->store)) {
            $stored = json_decode(Storage::get($this->store), true) ?: [];
        }

        return array_merge($this->defaults(), $stored);
    }

    protected function only(array $keys): array
    {
        return array_intersect_key($this->all(), array_flip($keys));
    }

    protected function save(array $data): void
    {
        Storage::put($this->store, json_encode($data, JSON_PRETTY_PRINT));
    }

    protected function patchStore(Request $request, string $message): JsonResponse
    {
        $merged = array_merge($this->all(), $request->all());
        $this->save($merged);

        return ApiResponse::success($merged, $message);
    }
}
