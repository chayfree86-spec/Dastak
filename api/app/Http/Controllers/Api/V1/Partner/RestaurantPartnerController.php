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
        $restaurant = $request->user()->restaurants()->with(['operatingHours', 'zone', 'bankAccount'])->first();

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

    public function updateRestaurant(UpdateRestaurantRequest $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $updated = $this->restaurantService->updateRestaurant($restaurant, $request->validated());

        return ApiResponse::success(
            new RestaurantResource($updated),
            'Restaurant profile updated successfully.'
        );
    }

    public function toggleOpen(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $isOpen = $request->boolean('is_open', ! $restaurant->is_open);

        $updated = $this->restaurantService->toggleOpenStatus($restaurant, $isOpen);

        $statusStr = $updated->is_open ? 'open for orders' : 'temporarily closed';

        return ApiResponse::success(
            new RestaurantResource($updated),
            "Restaurant is now {$statusStr}."
        );
    }

    public function updateOperatingHours(UpdateOperatingHoursRequest $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $this->restaurantService->updateOperatingHours($restaurant, $request->input('hours'));

        return ApiResponse::success(
            new RestaurantResource($restaurant->fresh('operatingHours')),
            'Operating hours updated successfully.'
        );
    }

    public function updateBankAccount(UpdateBankRequest $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $bank = $this->restaurantService->updateBankAccount($restaurant, $request->validated());

        return ApiResponse::success(
            new RestaurantBankAccountResource($bank),
            'Bank account details updated successfully.'
        );
    }
}
