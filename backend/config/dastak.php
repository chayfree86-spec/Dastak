<?php

return [
    'name' => env('APP_NAME', 'Dastak'),
    'tagline' => 'Jo Chahiye, Ghar Par',
    
    // Order Rules
    'orders' => [
        'cancel_window_minutes' => (int) env('DASTAK_ORDER_CANCEL_WINDOW_MINUTES', 5),
        'auto_accept_threshold_minutes' => 3,
    ],

    // Commission Rules
    'commission' => [
        'default_percentage' => (float) env('DASTAK_DEFAULT_COMMISSION_PERCENTAGE', 15.00),
    ],

    // Delivery Fleet Rules
    'delivery' => [
        'base_fee' => (float) env('DASTAK_BASE_DELIVERY_FEE', 35.00),
        'max_radius_km' => (int) env('DASTAK_MAX_DELIVERY_RADIUS_KM', 12),
        'default_dispatch_mode' => 'AUTO', // AUTO or MANUAL
    ],

    // Payment Gateway Default
    'payments' => [
        'default_gateway' => env('PAYMENT_GATEWAY_DEFAULT', 'razorpay'),
        'cod_enabled' => true,
    ],
];
