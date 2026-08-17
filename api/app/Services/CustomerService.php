<?php

namespace App\Services;

use App\Models\Address;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerService
{
    public function getAddresses(User $user): Collection
    {
        return $user->addresses()->orderByDesc('is_default')->latest()->get();
    }

    public function createAddress(User $user, array $data): Address
    {
        return DB::transaction(function () use ($user, $data) {
            $isFirstAddress = ! $user->addresses()->exists();
            $shouldBeDefault = ! empty($data['is_default']) || $isFirstAddress;

            if ($shouldBeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            $data['user_id'] = $user->id;
            $data['is_default'] = $shouldBeDefault;

            return Address::create($data);
        });
    }

    public function updateAddress(User $user, Address $address, array $data): Address
    {
        if ($address->user_id !== $user->id) {
            throw ValidationException::withMessages([
                'address' => ['You do not have authorization to edit this address.'],
            ]);
        }

        return DB::transaction(function () use ($user, $address, $data) {
            if (! empty($data['is_default']) && ! $address->is_default) {
                $user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }

            $address->update($data);
            return $address->fresh();
        });
    }

    public function deleteAddress(User $user, Address $address): void
    {
        if ($address->user_id !== $user->id) {
            throw ValidationException::withMessages([
                'address' => ['You do not have authorization to delete this address.'],
            ]);
        }

        DB::transaction(function () use ($user, $address) {
            $wasDefault = $address->is_default;
            $address->delete();

            // If the deleted address was default, promote another address to default
            if ($wasDefault) {
                $nextAddress = $user->addresses()->latest()->first();
                $nextAddress?->update(['is_default' => true]);
            }
        });
    }

    public function setDefaultAddress(User $user, Address $address): Address
    {
        if ($address->user_id !== $user->id) {
            throw ValidationException::withMessages([
                'address' => ['You do not have authorization to manage this address.'],
            ]);
        }

        return DB::transaction(function () use ($user, $address) {
            $user->addresses()->update(['is_default' => false]);
            $address->update(['is_default' => true]);
            return $address->fresh();
        });
    }

    public function updateProfile(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            if (isset($data['name'])) {
                $user->update(['name' => $data['name']]);
            }

            $profileData = array_intersect_key($data, array_flip([
                'gender',
                'date_of_birth',
                'alternate_mobile',
                'preferences',
            ]));

            if (! empty($profileData)) {
                $user->customerProfile()->updateOrCreate(
                    ['user_id' => $user->id],
                    $profileData
                );
            }

            return $user->fresh(['customerProfile']);
        });
    }
}
