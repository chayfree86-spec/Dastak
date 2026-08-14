<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\RestaurantResource;
use App\Http\Resources\ZoneResource;
use App\Services\MenuService;
use App\Services\RestaurantService;
use App\Services\ZoneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestaurantPublicController extends Controller
{
    public function __construct(
        protected RestaurantService $restaurantService,
        protected ZoneService $zoneService,
        protected MenuService $menuService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $lat = $request->filled('latitude') ? (float) $request->input('latitude') : null;
        $lng = $request->filled('longitude') ? (float) $request->input('longitude') : null;
        $radiusKm = (int) $request->input('radius_km', 12);
        $filters = $request->only(['is_pure_veg', 'is_open', 'search']);
        $perPage = (int) $request->input('per_page', 15);

        $paginator = $this->restaurantService->listNearbyRestaurants(
            latitude: $lat,
            longitude: $lng,
            filters: $filters,
            radiusKm: $radiusKm,
            perPage: $perPage
        );

        return ApiResponse::paginated(
            paginator: $paginator,
            resourceClass: RestaurantResource::class,
            message: 'Restaurants retrieved successfully.'
        );
    }

    public function show(string $slug): JsonResponse
    {
        $restaurant = $this->restaurantService->getRestaurantBySlug($slug);

        return ApiResponse::success(
            new RestaurantResource($restaurant),
            'Restaurant details retrieved successfully.'
        );
    }

    public function getMenu(string $slug): JsonResponse
    {
        $restaurant = $this->restaurantService->getRestaurantBySlug($slug);
        
        $menu = \Illuminate\Support\Facades\Cache::remember("public_menu_{$restaurant->id}", 300, function () use ($restaurant) {
            return $this->menuService->getPublicRestaurantMenu($restaurant);
        });

        return ApiResponse::success(
            MenuCategoryResource::collection($menu),
            'Restaurant menu retrieved successfully.'
        );
    }

    public function getZones(): JsonResponse
    {
        $zones = \Illuminate\Support\Facades\Cache::remember('public_active_zones', 300, function () {
            return $this->zoneService->listZones(onlyActive: true);
        });

        return ApiResponse::success(
            ZoneResource::collection($zones),
            'Active service zones retrieved successfully.'
        );
    }
}
