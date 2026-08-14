<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Requests\Cart\ApplyCouponRequest;
use App\Http\Requests\Cart\SetDeliveryAddressRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\CartResource;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}

    public function getCart(Request $request): JsonResponse
    {
        $cart = $this->cartService->getOrCreateCart($request->user());

        return ApiResponse::success(
            new CartResource($cart),
            'Cart retrieved successfully.'
        );
    }

    public function addItem(AddCartItemRequest $request): JsonResponse
    {
        $cart = $this->cartService->addItem(
            user: $request->user(),
            restaurantId: (int) $request->input('restaurant_id'),
            menuItemId: (int) $request->input('menu_item_id'),
            variantId: $request->filled('variant_id') ? (int) $request->input('variant_id') : null,
            addonIds: $request->input('addon_ids', []),
            quantity: (int) $request->input('quantity', 1),
            instructions: $request->input('instructions'),
            forceClear: (bool) $request->input('force_clear', false)
        );

        return ApiResponse::success(
            new CartResource($cart),
            'Item added to cart.',
            201
        );
    }

    public function updateItem(UpdateCartItemRequest $request, int $cartItemId): JsonResponse
    {
        $cart = $this->cartService->updateQuantity(
            user: $request->user(),
            cartItemId: $cartItemId,
            quantity: (int) $request->input('quantity')
        );

        return ApiResponse::success(
            new CartResource($cart),
            'Cart updated successfully.'
        );
    }

    public function removeItem(Request $request, int $cartItemId): JsonResponse
    {
        $cart = $this->cartService->removeItem(
            user: $request->user(),
            cartItemId: $cartItemId
        );

        return ApiResponse::success(
            new CartResource($cart),
            'Item removed from cart.'
        );
    }

    public function clearCart(Request $request): JsonResponse
    {
        $cart = $this->cartService->clearCart($request->user());

        return ApiResponse::success(
            new CartResource($cart),
            'Cart cleared successfully.'
        );
    }

    public function applyCoupon(ApplyCouponRequest $request): JsonResponse
    {
        $cart = $this->cartService->applyCoupon(
            user: $request->user(),
            couponCode: $request->input('code')
        );

        return ApiResponse::success(
            new CartResource($cart),
            'Promo code applied successfully.'
        );
    }

    public function removeCoupon(Request $request): JsonResponse
    {
        $cart = $this->cartService->removeCoupon($request->user());

        return ApiResponse::success(
            new CartResource($cart),
            'Promo code removed.'
        );
    }

    public function setDeliveryAddress(SetDeliveryAddressRequest $request): JsonResponse
    {
        $cart = $this->cartService->setDeliveryAddress(
            user: $request->user(),
            addressId: (int) $request->input('address_id')
        );

        return ApiResponse::success(
            new CartResource($cart),
            'Delivery address set for cart.'
        );
    }
}
