<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreZoneRequest;
use App\Http\Requests\Admin\UpdateZoneRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\ZoneResource;
use App\Models\Zone;
use App\Services\ZoneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZoneAdminController extends Controller
{
    public function __construct(
        protected ZoneService $zoneService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $zones = $this->zoneService->listZones(onlyActive: false);

        return ApiResponse::success(
            ZoneResource::collection($zones),
            'Service zones retrieved successfully.'
        );
    }

    public function store(StoreZoneRequest $request): JsonResponse
    {
        $zone = $this->zoneService->createZone($request->validated());

        return ApiResponse::success(
            new ZoneResource($zone),
            'Service zone created successfully.',
            201
        );
    }

    public function show(Zone $zone): JsonResponse
    {
        return ApiResponse::success(
            new ZoneResource($zone->loadCount('restaurants')),
            'Service zone retrieved successfully.'
        );
    }

    public function update(UpdateZoneRequest $request, Zone $zone): JsonResponse
    {
        $updated = $this->zoneService->updateZone($zone, $request->validated());

        return ApiResponse::success(
            new ZoneResource($updated),
            'Service zone updated successfully.'
        );
    }

    public function destroy(Zone $zone): JsonResponse
    {
        $this->zoneService->deleteZone($zone);

        return ApiResponse::success(null, 'Service zone deleted successfully.');
    }
}
