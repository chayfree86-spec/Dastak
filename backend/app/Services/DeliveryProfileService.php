<?php

namespace App\Services;

use App\Models\DeliveryBoyProfile;
use App\Models\User;

class DeliveryProfileService
{
    public function getProfile(User $user): DeliveryBoyProfile
    {
        return $user->deliveryProfile()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'is_online' => false,
                'is_busy' => false,
                'rating' => 5.00,
            ]
        );
    }

    public function updateProfile(User $user, array $data): DeliveryBoyProfile
    {
        $profile = $this->getProfile($user);
        $profile->update($data);
        return $profile->fresh();
    }

    public function toggleDutyStatus(User $user, bool $isOnline): DeliveryBoyProfile
    {
        $profile = $this->getProfile($user);

        // If rider goes offline, ensure busy is false
        $updates = ['is_online' => $isOnline];
        if (! $isOnline) {
            $updates['is_busy'] = false;
        }

        $profile->update($updates);
        return $profile->fresh();
    }

    public function updateLocation(User $user, float $latitude, float $longitude): DeliveryBoyProfile
    {
        $profile = $this->getProfile($user);
        $profile->update([
            'current_latitude' => $latitude,
            'current_longitude' => $longitude,
            'last_location_updated_at' => now(),
        ]);

        return $profile->fresh();
    }
}
