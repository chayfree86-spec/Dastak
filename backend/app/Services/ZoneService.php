<?php

namespace App\Services;

use App\Models\Zone;
use Illuminate\Database\Eloquent\Collection;

class ZoneService
{
    public function listZones(bool $onlyActive = false): Collection
    {
        $query = Zone::query();
        if ($onlyActive) {
            $query->where('is_active', true);
        }
        return $query->withCount('restaurants')->latest()->get();
    }

    public function createZone(array $data): Zone
    {
        return Zone::create($data);
    }

    public function updateZone(Zone $zone, array $data): Zone
    {
        $zone->update($data);
        return $zone->fresh();
    }

    public function deleteZone(Zone $zone): void
    {
        $zone->delete();
    }
}
