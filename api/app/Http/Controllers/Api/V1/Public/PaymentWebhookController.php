<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();
        $event = $payload['event'] ?? null;

        Log::info('Payment Webhook Received', ['event' => $event, 'payload' => $payload]);

        if ($event === 'payment.captured' || $event === 'order.paid') {
            $paymentEntity = $payload['payload']['payment']['entity'] ?? [];
            $gatewayOrderId = $paymentEntity['order_id'] ?? null;
            $gatewayPaymentId = $paymentEntity['id'] ?? null;

            if ($gatewayOrderId) {
                $payment = Payment::where('gateway_order_id', $gatewayOrderId)->first();
                if ($payment && $payment->status !== 'SUCCESS') {
                    $payment->update([
                        'gateway_payment_id' => $gatewayPaymentId,
                        'status' => 'SUCCESS',
                        'gateway_response_json' => $payload,
                        'paid_at' => now(),
                    ]);

                    $payment->order?->update([
                        'payment_status' => PaymentStatus::PAID,
                    ]);
                }
            }
        }

        return ApiResponse::success(null, 'Webhook processed successfully.');
    }
}
