<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreAddressRequest;
use App\Http\Requests\Customer\UpdateAddressRequest;
use App\Http\Requests\Customer\UpdateProfileRequest;
use App\Http\Resources\AddressResource;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\UserResource;
use App\Models\Address;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerProfileController extends Controller
{
    public function __construct(
        protected CustomerService $customerService
    ) {}

    public function getProfile(Request $request): JsonResponse
    {
        $user = $request->user()->load(['customerProfile', 'roles']);

        return ApiResponse::success(
            new UserResource($user),
            'Profile retrieved successfully.'
        );
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->customerService->updateProfile($request->user(), $request->validated());

        return ApiResponse::success(
            new UserResource($user),
            'Profile updated successfully.'
        );
    }

    public function getAddresses(Request $request): JsonResponse
    {
        $addresses = $this->customerService->getAddresses($request->user());

        return ApiResponse::success(
            AddressResource::collection($addresses),
            'Addresses retrieved successfully.'
        );
    }

    public function storeAddress(StoreAddressRequest $request): JsonResponse
    {
        $address = $this->customerService->createAddress($request->user(), $request->validated());

        return ApiResponse::success(
            new AddressResource($address),
            'Address saved successfully.',
            201
        );
    }

    public function updateAddress(UpdateAddressRequest $request, Address $address): JsonResponse
    {
        $updatedAddress = $this->customerService->updateAddress($request->user(), $address, $request->validated());

        return ApiResponse::success(
            new AddressResource($updatedAddress),
            'Address updated successfully.'
        );
    }

    public function destroyAddress(Request $request, Address $address): JsonResponse
    {
        $this->customerService->deleteAddress($request->user(), $address);

        return ApiResponse::success(null, 'Address deleted successfully.');
    }

    public function setDefaultAddress(Request $request, Address $address): JsonResponse
    {
        $defaultAddress = $this->customerService->setDefaultAddress($request->user(), $address);

        return ApiResponse::success(
            new AddressResource($defaultAddress),
            'Default address updated successfully.'
        );
    }
}
