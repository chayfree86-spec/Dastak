<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    public function submitReview(User $customer, array $data): Review
    {
        $order = Order::where('customer_id', $customer->id)
            ->where('id', $data['order_id'])
            ->firstOrFail();

        if ($order->status !== OrderStatus::DELIVERED) {
            throw ValidationException::withMessages([
                'order' => ['You can only review delivered orders.'],
            ]);
        }

        if (Review::where('order_id', $order->id)->exists()) {
            throw ValidationException::withMessages([
                'order' => ['You have already submitted a review for this order.'],
            ]);
        }

        return DB::transaction(function () use ($order, $customer, $data) {
            $review = Review::create([
                'order_id' => $order->id,
                'customer_id' => $customer->id,
                'restaurant_id' => $order->restaurant_id,
                'delivery_boy_id' => $order->delivery_boy_id,
                'food_rating' => (int) $data['food_rating'],
                'delivery_rating' => isset($data['delivery_rating']) ? (int) $data['delivery_rating'] : null,
                'comment' => $data['comment'] ?? null,
                'is_visible' => true,
            ]);

            // Auto Recalculate Average Ratings
            $this->recalculateRatings($order->restaurant_id, $order->delivery_boy_id);

            return $review->fresh(['restaurant', 'deliveryBoy', 'customer']);
        });
    }

    public function replyToReview(Review $review, string $reply): Review
    {
        $review->update([
            'restaurant_reply' => $reply,
            'restaurant_replied_at' => now(),
        ]);

        return $review->fresh();
    }

    public function recalculateRatings(int $restaurantId, ?int $deliveryBoyId = null): void
    {
        // 1. Recalculate Restaurant Average Rating
        $restaurantStats = Review::where('restaurant_id', $restaurantId)
            ->where('is_visible', true)
            ->selectRaw('AVG(food_rating) as avg_rating, COUNT(id) as total_count')
            ->first();

        if ($restaurantStats) {
            Restaurant::where('id', $restaurantId)->update([
                'rating' => round((float) ($restaurantStats->avg_rating ?? 5.0), 2),
                'total_ratings' => (int) ($restaurantStats->total_count ?? 0),
            ]);
        }

        // 2. Recalculate Delivery Boy Average Rating
        if ($deliveryBoyId) {
            $riderStats = Review::where('delivery_boy_id', $deliveryBoyId)
                ->whereNotNull('delivery_rating')
                ->where('is_visible', true)
                ->selectRaw('AVG(delivery_rating) as avg_rating, COUNT(id) as total_count')
                ->first();

            if ($riderStats) {
                $rider = User::find($deliveryBoyId);
                $rider?->deliveryProfile?->update([
                    'rating' => round((float) ($riderStats->avg_rating ?? 5.0), 2),
                    'total_ratings' => (int) ($riderStats->total_count ?? 0),
                ]);
            }
        }
    }
}
