<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\PaymentGateway;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\InitiatePaymentRequest;
use App\Http\Requests\Payment\VerifyPaymentRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;

class CustomerPaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    public function initiate(InitiatePaymentRequest $request): JsonResponse
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->where('order_number', $request->input('order_number'))
            ->firstOrFail();

        $gateway = $request->filled('gateway')
            ? PaymentGateway::from($request->input('gateway'))
            : PaymentGateway::RAZORPAY;

        $paymentData = $this->paymentService->initiatePayment($order, $gateway);

        return ApiResponse::success(
            $paymentData,
            'Online payment initialized.'
        );
    }

    public function verify(VerifyPaymentRequest $request): JsonResponse
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->where('order_number', $request->input('order_number'))
            ->firstOrFail();

        $payment = $this->paymentService->verifyPayment(
            order: $order,
            gatewayPaymentId: $request->input('gateway_payment_id'),
            gatewaySignature: $request->input('gateway_signature'),
            payload: $request->all()
        );

        return ApiResponse::success(
            new PaymentResource($payment),
            'Payment verified and settled successfully.'
        );
    }
}
