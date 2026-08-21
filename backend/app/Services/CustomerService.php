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
            $userUpdates = [];
            if (isset($data['name'])) {
                $userUpdates['name'] = $data['name'];
            }
            if (isset($data['email'])) {
                $userUpdates['email'] = $data['email'];
            }
            if (isset($data['avatar'])) {
                $avatarVal = $data['avatar'];
                if ($avatarVal instanceof \Illuminate\Http\UploadedFile) {
                    $path = $avatarVal->store('avatars', 'public');
                    $userUpdates['avatar'] = $path;
                } elseif (is_string($avatarVal) && str_starts_with($avatarVal, 'data:image')) {
                    if (preg_match('/^data:image\/(\w+);base64,/', $avatarVal, $type)) {
                        $imgData = substr($avatarVal, strpos($avatarVal, ',') + 1);
                        $imgData = base64_decode($imgData);
                        if ($imgData !== false) {
                            $ext = strtolower($type[1]) ?: 'jpg';
                            $fileName = 'avatar_' . $user->id . '_' . time() . '.' . $ext;
                            \Illuminate\Support\Facades\Storage::disk('public')->put('avatars/' . $fileName, $imgData);
                            $userUpdates['avatar'] = 'avatars/' . $fileName;
                        }
                    }
                } elseif (is_string($avatarVal)) {
                    $userUpdates['avatar'] = $avatarVal;
                }
            }
            if (! empty($userUpdates)) {
                $user->update($userUpdates);
            }

            $profileData = array_intersect_key($data, array_flip([
                'gender',
                'dietary_preference',
                'date_of_birth',
                'anniversary_date',
                'alternate_mobile',
                'preferences',
                'taste_preferences',
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

    public function changePin(User $user, string $newPin, ?string $currentPin = null): void
    {
        $cleanNewPin = trim($newPin);
        if (strlen($cleanNewPin) !== 4 || ! ctype_digit($cleanNewPin)) {
            throw ValidationException::withMessages([
                'new_pin' => ['New PIN must be exactly 4 numeric digits.'],
            ]);
        }

        $defaultPin = substr($user->mobile, -4);

        if (! empty($user->login_pin)) {
            if (empty($currentPin)) {
                throw ValidationException::withMessages([
                    'current_pin' => ['Please enter your current 4-digit PIN.'],
                ]);
            }
            if (! \Illuminate\Support\Facades\Hash::check(trim($currentPin), $user->login_pin)) {
                throw ValidationException::withMessages([
                    'current_pin' => ['Current PIN is incorrect.'],
                ]);
            }
        } else {
            // First time changing default PIN (default is last 4 digits of mobile)
            if (! empty($currentPin) && trim($currentPin) !== $defaultPin && ! \Illuminate\Support\Facades\Hash::check(trim($currentPin), $user->password)) {
                throw ValidationException::withMessages([
                    'current_pin' => ["Current PIN is incorrect. Default PIN is the last 4 digits ({$defaultPin}) of your mobile number."],
                ]);
            }
        }

        $user->update([
            'login_pin' => \Illuminate\Support\Facades\Hash::make($cleanNewPin),
        ]);
    }
}
