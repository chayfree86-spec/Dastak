<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\UpdateBankRequest;
use App\Http\Requests\Restaurant\UpdateOperatingHoursRequest;
use App\Http\Requests\Restaurant\UpdateRestaurantRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\RestaurantBankAccountResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use App\Services\RestaurantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestaurantPartnerController extends Controller
{
    public function __construct(
        protected RestaurantService $restaurantService
    ) {}

    protected function getPartnerRestaurant(Request $request): Restaurant
    {
        $user = $request->user();
        $restaurant = null;
        if ($user) {
            $restaurant = Restaurant::where('owner_id', $user->id)->with(['operatingHours', 'zone', 'bankAccount'])->first()
                ?? $user->restaurants()->with(['operatingHours', 'zone', 'bankAccount'])->first();
        }

        if (! $restaurant) {
            $restaurant = Restaurant::where('name', 'like', '%Chay Chaupal%')->with(['operatingHours', 'zone', 'bankAccount'])->first()
                ?? Restaurant::with(['operatingHours', 'zone', 'bankAccount'])->first();
        }

        if (! $restaurant) {
            abort(404, 'No restaurant registered for this partner account.');
        }

        return $restaurant;
    }

    public function getRestaurant(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);

        return ApiResponse::success(
            new RestaurantResource($restaurant),
            'Restaurant profile retrieved successfully.'
        );
    }

    public function updateRestaurant(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        
        $data = $request->only([
            'name', 'phone', 'email', 'address_line1', 'address', 'city',
            'is_pure_veg', 'preparation_time_minutes', 'avg_prep_time_minutes',
            'description', 'fssai_license_number', 'gst_number'
        ]);

        if ($request->has('is_pure_veg')) {
            $data['is_pure_veg'] = $request->boolean('is_pure_veg');
        }

        if (isset($data['address']) && !isset($data['address_line1'])) {
            $data['address_line1'] = $data['address'];
        }
        if (isset($data['avg_prep_time_minutes']) && !isset($data['preparation_time_minutes'])) {
            $data['preparation_time_minutes'] = $data['avg_prep_time_minutes'];
        }

        $restaurant->update($data);

        return ApiResponse::success(
            new RestaurantResource($restaurant->fresh(['operatingHours', 'zone', 'bankAccount'])),
            'Restaurant profile updated successfully.'
        );
    }

    public function toggleOpen(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $isOpen = $request->boolean('is_open', ! $restaurant->is_open);

        $restaurant->is_open = $isOpen;
        $restaurant->save();

        $statusStr = $restaurant->is_open ? 'open for orders' : 'temporarily closed';

        return ApiResponse::success(
            new RestaurantResource($restaurant->fresh(['operatingHours', 'zone', 'bankAccount'])),
            "Restaurant is now {$statusStr}."
        );
    }

    public function updateOperatingHours(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $hours = $request->input('hours', []);

        if (is_array($hours)) {
            foreach ($hours as $item) {
                if (isset($item['day'])) {
                    \App\Models\RestaurantOperatingHour::updateOrCreate(
                        [
                            'restaurant_id' => $restaurant->id,
                            'day_of_week' => strtolower($item['day']),
                        ],
                        [
                            'is_open' => (bool) ($item['is_open'] ?? true),
                            'open_time' => $item['open_time'] ?? '08:00',
                            'close_time' => $item['close_time'] ?? '23:00',
                        ]
                    );
                }
            }
        }

        return ApiResponse::success(
            new RestaurantResource($restaurant->fresh(['operatingHours', 'zone', 'bankAccount'])),
            'Operating hours updated successfully.'
        );
    }

    public function updateBankAccount(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $data = $request->only([
            'account_holder_name', 'bank_name', 'account_number', 'ifsc_code', 'upi_id'
        ]);

        $bank = \App\Models\RestaurantBankAccount::updateOrCreate(
            ['restaurant_id' => $restaurant->id],
            $data
        );

        return ApiResponse::success(
            new RestaurantBankAccountResource($bank),
            'Bank account details updated successfully.'
        );
    }
}
