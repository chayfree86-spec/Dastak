<?php

use App\Http\Controllers\Api\V1\Admin\AnalyticsAdminController;
use App\Http\Controllers\Api\V1\Admin\CouponAdminController;
use App\Http\Controllers\Api\V1\Admin\CustomerAdminController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\DeliveryBoyAdminController;
use App\Http\Controllers\Api\V1\Admin\FinanceAdminController;
use App\Http\Controllers\Api\V1\Admin\FinanceScreenController;
use App\Http\Controllers\Api\V1\Admin\FleetAdminController;
use App\Http\Controllers\Api\V1\Admin\FoodCategoryAdminController;
use App\Http\Controllers\Api\V1\Admin\MarketingAdminController;
use App\Http\Controllers\Api\V1\Admin\MenuAdminController;
use App\Http\Controllers\Api\V1\Admin\OrderAdminController;
use App\Http\Controllers\Api\V1\Admin\ReportAdminController;
use App\Http\Controllers\Api\V1\Admin\ReportScreenController;
use App\Http\Controllers\Api\V1\Admin\RestaurantAdminController;
use App\Http\Controllers\Api\V1\Admin\ReviewAdminController;
use App\Http\Controllers\Api\V1\Admin\SettingsController;
use App\Http\Controllers\Api\V1\Admin\SettlementAdminController;
use App\Http\Controllers\Api\V1\Admin\SmsLogAdminController;
use App\Http\Controllers\Api\V1\Admin\SupportAdminController;
use App\Http\Controllers\Api\V1\Admin\UserManagementController;
use App\Http\Controllers\Api\V1\Admin\ZoneAdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\SystemMaintenanceController;
use App\Http\Controllers\Api\V1\GeocodeController;
use App\Http\Controllers\Api\V1\Customer\CartController;
use App\Http\Controllers\Api\V1\Customer\CustomerOrderController;
use App\Http\Controllers\Api\V1\Customer\CustomerPaymentController;
use App\Http\Controllers\Api\V1\Customer\CustomerProfileController;
use App\Http\Controllers\Api\V1\Customer\CustomerReviewController;
use App\Http\Controllers\Api\V1\Customer\CustomerTicketController;
use App\Http\Controllers\Api\V1\Customer\CustomerTrackingController;
use App\Http\Controllers\Api\V1\Delivery\DeliveryAnalyticsController;
use App\Http\Controllers\Api\V1\Delivery\DeliveryCodController;
use App\Http\Controllers\Api\V1\Delivery\DeliveryLocationController;
use App\Http\Controllers\Api\V1\Delivery\DeliveryOrderController;
use App\Http\Controllers\Api\V1\Delivery\DeliveryProfileController;
use App\Http\Controllers\Api\V1\Delivery\DeliveryReviewController;
use App\Http\Controllers\Api\V1\DeviceTokenController;
use App\Http\Controllers\Api\V1\Customer\CustomerDeviceAuthController;
use App\Http\Controllers\Api\V1\Delivery\DeliveryDeviceAuthController;
use App\Http\Controllers\Api\V1\Partner\PartnerDeviceAuthController;
use App\Http\Controllers\Api\V1\Partner\MenuPartnerController;
use App\Http\Controllers\Api\V1\Partner\PartnerAnalyticsController;
use App\Http\Controllers\Api\V1\Partner\PartnerOrderController;
use App\Http\Controllers\Api\V1\Partner\PartnerReviewController;
use App\Http\Controllers\Api\V1\Partner\RestaurantPartnerController;
use App\Http\Controllers\Api\V1\Public\CouponPublicController;
use App\Http\Controllers\Api\V1\Public\PaymentWebhookController;
use App\Http\Controllers\Api\V1\Public\FoodCategoryPublicController;
use App\Http\Controllers\Api\V1\Public\PublicStatsController;
use App\Http\Controllers\Api\V1\Public\RestaurantPublicController;
use App\Http\Controllers\Api\V1\Public\ReviewPublicController;
use App\Http\Controllers\Api\V1\RolePermissionController;
use App\Http\Middleware\CheckAccountStatus;
use App\Http\Middleware\CheckRole;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dastak Platform API Routes (V1)
|--------------------------------------------------------------------------
|
| All application API routes are versioned under /api/v1/.
| Business logic is strictly enforced server-side.
|
*/

Route::prefix('v1')->group(function () {

    // System Maintenance, Direct Migration Runner & Health
    Route::prefix('system')->group(function () {
        Route::match(['get', 'post'], '/run-migrations', [SystemMaintenanceController::class, 'runMigrations']);
        Route::match(['get', 'post'], '/optimize-cache', [SystemMaintenanceController::class, 'optimizeCache']);
        Route::match(['get', 'post'], '/clean-database', [SystemMaintenanceController::class, 'cleanDatabase']);
        Route::get('/health', [SystemMaintenanceController::class, 'health']);
    });

    // 1. Public Discovery & Catalog Routes
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/send-otp', [AuthController::class, 'sendOtp']);
        Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    });

    // Customer Device Authentication
    Route::prefix('customer/auth')->group(function () {
        Route::post('/start', [CustomerDeviceAuthController::class, 'start']);
        Route::post('/resend-otp', [CustomerDeviceAuthController::class, 'resendOtp']);
        Route::post('/verify', [CustomerDeviceAuthController::class, 'verify']);
        Route::post('/verify-pin', [CustomerDeviceAuthController::class, 'verifyPin']);
        Route::post('/session', [CustomerDeviceAuthController::class, 'session']);
    });

    // Delivery Rider Device Authentication
    Route::prefix('delivery/auth')->group(function () {
        Route::post('/start', [DeliveryDeviceAuthController::class, 'start']);
        Route::post('/resend-otp', [DeliveryDeviceAuthController::class, 'resendOtp']);
        Route::post('/verify', [DeliveryDeviceAuthController::class, 'verify']);
        Route::post('/session', [DeliveryDeviceAuthController::class, 'session']);
    });

    // Restaurant Partner Device Authentication
    Route::prefix('partner/auth')->group(function () {
        Route::post('/start', [PartnerDeviceAuthController::class, 'start']);
        Route::post('/resend-otp', [PartnerDeviceAuthController::class, 'resendOtp']);
        Route::post('/verify', [PartnerDeviceAuthController::class, 'verify']);
        Route::post('/session', [PartnerDeviceAuthController::class, 'session']);
    });

    // Admin Auth Aliases
    Route::prefix('admin/auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'me']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
    });

    Route::get('/restaurants', [RestaurantPublicController::class, 'index']);
    Route::get('/restaurants/{slug}', [RestaurantPublicController::class, 'show']);
    Route::get('/restaurants/{slug}/menu', [RestaurantPublicController::class, 'getMenu']);
    Route::get('/restaurants/{slug}/reviews', [ReviewPublicController::class, 'getRestaurantReviews']);
    Route::get('/zones', [RestaurantPublicController::class, 'getZones']);
    Route::get('/categories', [RestaurantPublicController::class, 'getCategories']);
    Route::get('/coupons', [CouponPublicController::class, 'index']);

    // Landing-page public marketing data (real numbers + real reviews)
    Route::get('/stats', [PublicStatsController::class, 'stats']);
    Route::get('/testimonials', [PublicStatsController::class, 'testimonials']);
    Route::get('/config', [PublicStatsController::class, 'config']);

    // Customer home food-category chips (DB driven)
    Route::get('/food-categories', [FoodCategoryPublicController::class, 'index']);
    
    // Intelligent NLP Search & Suggestions
    Route::get('/search', [\App\Http\Controllers\Api\V1\Public\SearchController::class, 'search']);
    Route::get('/search/suggestions', [\App\Http\Controllers\Api\V1\Public\SearchController::class, 'suggestions']);
    
    // Gateway Webhook
    Route::post('/payments/webhook', [PaymentWebhookController::class, 'handle']);

    // Geolocation & Address Resolution Services
    Route::get('/geocode/reverse', [GeocodeController::class, 'reverse']);
    Route::get('/geocode/forward', [GeocodeController::class, 'forward']);
    Route::get('/geocode/detect-ip', [GeocodeController::class, 'detectIpLocation']);

    // 2. Protected Routes (Sanctum Authenticated + Active Account Validation)
    Route::middleware(['auth:sanctum', CheckAccountStatus::class])->group(function () {

        // Authenticated User Identity Context & Device Push Tokens
        Route::prefix('auth')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/change-password', [AuthController::class, 'changePassword']);
            Route::post('/device-token', [DeviceTokenController::class, 'store']);
            Route::delete('/device-token', [DeviceTokenController::class, 'destroy']);
        });

        // Device-Bound Session Operations
        Route::post('/customer/auth/change-device', [CustomerDeviceAuthController::class, 'changeDevice']);
        Route::post('/customer/auth/logout', [CustomerDeviceAuthController::class, 'logout']);

        Route::post('/delivery/auth/change-device', [DeliveryDeviceAuthController::class, 'changeDevice']);
        Route::post('/delivery/auth/logout', [DeliveryDeviceAuthController::class, 'logout']);

        Route::post('/partner/auth/change-device', [PartnerDeviceAuthController::class, 'changeDevice']);
        Route::post('/partner/auth/logout', [PartnerDeviceAuthController::class, 'logout']);

        // In-App Notifications Feed for Authenticated Users
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::patch('/read-all', [NotificationController::class, 'markAllAsRead']);
            Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
            Route::delete('/{id}', [NotificationController::class, 'destroy']);
        });

        // Customer Profile, Address Book, Cart, Orders, Payments, Reviews & Support
        Route::prefix('customer')->group(function () {
            Route::get('/profile', [CustomerProfileController::class, 'getProfile']);
            Route::put('/profile', [CustomerProfileController::class, 'updateProfile']);
            Route::post('/profile/change-pin', [CustomerProfileController::class, 'changePin']);
            
            // Saved Addresses
            Route::get('/addresses', [CustomerProfileController::class, 'getAddresses']);
            Route::post('/addresses', [CustomerProfileController::class, 'storeAddress']);
            Route::put('/addresses/{address}', [CustomerProfileController::class, 'updateAddress']);
            Route::delete('/addresses/{address}', [CustomerProfileController::class, 'destroyAddress']);
            Route::patch('/addresses/{address}/default', [CustomerProfileController::class, 'setDefaultAddress']);

            // Cart System
            Route::prefix('cart')->group(function () {
                Route::get('/', [CartController::class, 'getCart']);
                Route::post('/items', [CartController::class, 'addItem']);
                Route::put('/items/{cart_item_id}', [CartController::class, 'updateItem']);
                Route::delete('/items/{cart_item_id}', [CartController::class, 'removeItem']);
                Route::delete('/', [CartController::class, 'clearCart']);
                Route::post('/apply-coupon', [CartController::class, 'applyCoupon']);
                Route::post('/remove-coupon', [CartController::class, 'removeCoupon']);
                Route::post('/delivery-address', [CartController::class, 'setDeliveryAddress']);
            });

            // Customer Orders & Live Tracking
            Route::prefix('orders')->group(function () {
                Route::post('/checkout', [CustomerOrderController::class, 'checkout']);
                Route::get('/', [CustomerOrderController::class, 'index']);
                Route::get('/{order_number}', [CustomerOrderController::class, 'show']);
                Route::get('/{order_number}/live-tracking', [CustomerTrackingController::class, 'liveTracking']);
                Route::post('/{order_number}/cancel', [CustomerOrderController::class, 'cancel']);
            });

            // Online Payment Checkout & Verification
            Route::prefix('payments')->group(function () {
                Route::post('/initiate', [CustomerPaymentController::class, 'initiate']);
                Route::post('/verify', [CustomerPaymentController::class, 'verify']);
            });

            // Customer Ratings & Reviews
            Route::prefix('reviews')->group(function () {
                Route::get('/', [CustomerReviewController::class, 'index']);
                Route::post('/', [CustomerReviewController::class, 'store']);
            });

            // Support Tickets & Threaded Messaging
            Route::prefix('tickets')->group(function () {
                Route::get('/', [CustomerTicketController::class, 'index']);
                Route::post('/', [CustomerTicketController::class, 'store']);
                Route::get('/{ticket_number}', [CustomerTicketController::class, 'show']);
                Route::post('/{ticket_number}/messages', [CustomerTicketController::class, 'addMessage']);
            });
        });

        // Delivery Rider Fleet Endpoints
        Route::prefix('delivery')->group(function () {
            Route::get('/profile', [DeliveryProfileController::class, 'getProfile']);
            Route::put('/profile', [DeliveryProfileController::class, 'updateProfile']);
            Route::patch('/duty-status', [DeliveryProfileController::class, 'toggleDutyStatus']);
            Route::post('/location', [DeliveryProfileController::class, 'updateLocation']);
            Route::post('/location/stream', [DeliveryLocationController::class, 'streamLocation']);

            // Rider Orders
            Route::prefix('orders')->group(function () {
                Route::get('/assigned', [DeliveryOrderController::class, 'assignedOrder']);
                Route::get('/history', [DeliveryOrderController::class, 'history']);
                Route::patch('/{order_number}/pickup', [DeliveryOrderController::class, 'pickupOrder']);
                Route::post('/{order_number}/verify-delivery', [DeliveryOrderController::class, 'verifyDelivery']);
            });

            // Rider COD Cash Ledger
            Route::prefix('cod')->group(function () {
                Route::get('/ledger', [DeliveryCodController::class, 'ledger']);
                Route::post('/deposit', [DeliveryCodController::class, 'deposit']);
            });

            // Rider Delivery Ratings & Feedback
            Route::get('/reviews', [DeliveryReviewController::class, 'index']);

            // Rider Analytics & Earnings Summary
            Route::get('/analytics/summary', [DeliveryAnalyticsController::class, 'summary']);
        });

        // Restaurant Partner Portal Endpoints
        Route::prefix('partner')->middleware([CheckRole::class . ':restaurant_owner,super_admin'])->group(function () {
            
            // Restaurant Profile & Operations
            Route::prefix('restaurant')->group(function () {
                Route::get('/', [RestaurantPartnerController::class, 'getRestaurant']);
                Route::put('/', [RestaurantPartnerController::class, 'updateRestaurant']);
                Route::patch('/toggle-open', [RestaurantPartnerController::class, 'toggleOpen']);
                Route::put('/operating-hours', [RestaurantPartnerController::class, 'updateOperatingHours']);
                Route::put('/bank-account', [RestaurantPartnerController::class, 'updateBankAccount']);
            });

            // Menu Management
            Route::prefix('menu')->group(function () {
                Route::get('/tree', [MenuPartnerController::class, 'tree']);
                // Categories
                Route::get('/categories', [MenuPartnerController::class, 'getCategories']);
                Route::post('/categories', [MenuPartnerController::class, 'storeCategory']);
                Route::put('/categories/{category}', [MenuPartnerController::class, 'updateCategory']);
                Route::delete('/categories/{category}', [MenuPartnerController::class, 'destroyCategory']);

                // Menu Items
                Route::get('/items', [MenuPartnerController::class, 'getItems']);
                Route::post('/items', [MenuPartnerController::class, 'storeItem']);
                Route::get('/items/{item}', [MenuPartnerController::class, 'showItem']);
                Route::put('/items/{item}', [MenuPartnerController::class, 'updateItem']);
                Route::delete('/items/{item}', [MenuPartnerController::class, 'destroyItem']);
                Route::patch('/items/{item}/toggle-availability', [MenuPartnerController::class, 'toggleItemAvailability']);
                Route::patch('/items/{item}/availability', [MenuPartnerController::class, 'toggleItemAvailability']);
                Route::get('/search-food-images', [MenuPartnerController::class, 'searchFoodImages']);
                Route::post('/upload-image', [MenuPartnerController::class, 'uploadImage']);
            });

            // Kitchen Order Management
            Route::prefix('orders')->group(function () {
                Route::get('/', [PartnerOrderController::class, 'index']);
                Route::get('/{order_number}', [PartnerOrderController::class, 'show']);
                Route::patch('/{order_number}/accept', [PartnerOrderController::class, 'accept']);
                Route::patch('/{order_number}/preparing', [PartnerOrderController::class, 'markPreparing']);
                Route::patch('/{order_number}/ready', [PartnerOrderController::class, 'markReady']);
                Route::patch('/{order_number}/reject', [PartnerOrderController::class, 'reject']);
            });

            // Customer Reviews Feedback & Replies
            Route::prefix('reviews')->group(function () {
                Route::get('/', [PartnerReviewController::class, 'index']);
                Route::post('/{id}/reply', [PartnerReviewController::class, 'reply']);
            });

            // Kitchen Live Analytics & Merchant Settlements
            Route::prefix('analytics')->group(function () {
                Route::get('/dashboard', [PartnerAnalyticsController::class, 'dashboard']);
                Route::get('/reports', [PartnerAnalyticsController::class, 'reports']);
            });
            Route::get('/settlements', [PartnerAnalyticsController::class, 'settlements']);
        });

        // Admin Management Endpoints
        Route::prefix('admin')->group(function () {
            
            // Roles and Permissions (Super Admin)
            Route::middleware([CheckRole::class . ':super_admin'])->group(function () {
                Route::get('/roles', [RolePermissionController::class, 'getRoles']);
                Route::get('/permissions', [RolePermissionController::class, 'getPermissions']);
            });

            // Operations, Finance, Support & Super Admin Management
            Route::middleware([CheckRole::class . ':super_admin,operations_admin,finance_admin,support_admin'])->group(function () {
                Route::get('/users', [UserManagementController::class, 'index']);
                Route::get('/users/{id}', [UserManagementController::class, 'show']);
                Route::patch('/users/{user}/status', [UserManagementController::class, 'updateStatus']);
                Route::patch('/users/{user}/roles', [UserManagementController::class, 'assignRoles']);
                
                // Restaurant Onboarding & Status Moderation
                Route::get('/restaurants', [RestaurantAdminController::class, 'index']);
                Route::post('/restaurants', [RestaurantAdminController::class, 'store']);
                Route::post('/restaurants/upload-image', [RestaurantAdminController::class, 'uploadImage']);
                Route::get('/restaurants/{id}', [RestaurantAdminController::class, 'show']);
                Route::put('/restaurants/{restaurant}', [RestaurantAdminController::class, 'update']);
                Route::patch('/restaurants/{restaurant}/status', [RestaurantAdminController::class, 'updateStatus']);
                Route::put('/restaurants/{id}/operating-hours', [RestaurantAdminController::class, 'updateOperatingHours']);

                // Restaurant detail tabs: menu, orders, earnings, settlements, reviews & rating
                Route::get('/restaurants/{id}/orders', [RestaurantAdminController::class, 'getOrders']);
                Route::get('/restaurants/{id}/earnings', [RestaurantAdminController::class, 'getEarnings']);
                Route::get('/restaurants/{id}/settlements', [RestaurantAdminController::class, 'getSettlements']);
                Route::get('/restaurants/{id}/reviews', [RestaurantAdminController::class, 'getReviews']);
                Route::put('/restaurants/{id}/rating', [RestaurantAdminController::class, 'updateRating']);
                Route::post('/restaurants/{id}/recalculate-rating', [RestaurantAdminController::class, 'recalculateRating']);
                Route::patch('/reviews/{id}/visibility', [ReviewAdminController::class, 'toggleVisibility']);
                Route::post('/reviews/{id}/reply', [ReviewAdminController::class, 'reply']);

                // Full menu management: categories, sub-categories, items, image upload
                Route::get('/restaurants/{id}/menu', [MenuAdminController::class, 'menu']);
                Route::get('/restaurants/{id}/menu/search-food-images', [MenuAdminController::class, 'searchFoodImages']);
                Route::post('/restaurants/{id}/menu/upload-image', [MenuAdminController::class, 'uploadImage']);
                Route::post('/restaurants/{id}/menu/categories', [MenuAdminController::class, 'storeCategory']);
                Route::put('/restaurants/{id}/menu/categories/{categoryId}', [MenuAdminController::class, 'updateCategory']);
                Route::delete('/restaurants/{id}/menu/categories/{categoryId}', [MenuAdminController::class, 'destroyCategory']);
                Route::post('/restaurants/{id}/menu/items', [MenuAdminController::class, 'storeItem']);
                Route::put('/restaurants/{id}/menu/items/{itemId}', [MenuAdminController::class, 'updateItem']);
                Route::delete('/restaurants/{id}/menu/items/{itemId}', [MenuAdminController::class, 'destroyItem']);
                Route::patch('/restaurants/{id}/menu/items/{itemId}/availability', [MenuAdminController::class, 'toggleItemAvailability']);

                // Delivery Fleet Management
                Route::get('/delivery-boys', [DeliveryBoyAdminController::class, 'index']);
                Route::post('/delivery-boys/upload-document', [DeliveryBoyAdminController::class, 'uploadDocument']);
                Route::post('/delivery-boys', [DeliveryBoyAdminController::class, 'store']);
                Route::get('/delivery-boys/{id}', [DeliveryBoyAdminController::class, 'show']);
                Route::put('/delivery-boys/{id}', [DeliveryBoyAdminController::class, 'update']);
                Route::delete('/delivery-boys/{id}', [DeliveryBoyAdminController::class, 'destroy']);
                Route::get('/delivery-boys/{id}/id-card', [DeliveryBoyAdminController::class, 'downloadIdCard']);
                Route::patch('/delivery-boys/{id}/status', [DeliveryBoyAdminController::class, 'updateStatus']);
                Route::get('/delivery-boys/{id}/active-deliveries', [DeliveryBoyAdminController::class, 'activeDeliveries']);
                Route::get('/delivery-boys/{id}/orders', [DeliveryBoyAdminController::class, 'orderHistory']);
                Route::get('/delivery-boys/{id}/earnings', [DeliveryBoyAdminController::class, 'earnings']);
                Route::get('/delivery-boys/{id}/cod-collections', [DeliveryBoyAdminController::class, 'codCollection']);
                Route::post('/delivery-boys/{id}/reconcile-cod', [DeliveryBoyAdminController::class, 'reconcileCod']);

                // Customer Directory & Management
                Route::get('/customers', [CustomerAdminController::class, 'index']);
                Route::get('/customers/{id}', [CustomerAdminController::class, 'show']);
                Route::get('/customers/{id}/orders', [CustomerAdminController::class, 'orders']);
                Route::get('/customers/{id}/addresses', [CustomerAdminController::class, 'addresses']);
                Route::get('/customers/{id}/complaints', [CustomerAdminController::class, 'complaints']);
                Route::patch('/customers/{id}/block-status', [CustomerAdminController::class, 'toggleBlock']);

                // Service Zones Management
                Route::apiResource('/zones', ZoneAdminController::class);

                // Promotional Coupons Management
                Route::apiResource('/coupons', CouponAdminController::class);

                // Marketing screen (coupons + banners + push) consumed by the admin panel
                Route::prefix('marketing')->group(function () {
                    Route::get('/coupons', [MarketingAdminController::class, 'index']);
                    Route::post('/coupons', [MarketingAdminController::class, 'store']);
                    Route::put('/coupons/{coupon}', [MarketingAdminController::class, 'update']);
                    Route::patch('/coupons/{coupon}/status', [MarketingAdminController::class, 'toggleStatus']);
                    Route::delete('/coupons/{coupon}', [MarketingAdminController::class, 'destroy']);

                    Route::get('/banners', [MarketingAdminController::class, 'banners']);
                    Route::post('/banners', [MarketingAdminController::class, 'storeBanner']);
                    Route::put('/banners/{id}', [MarketingAdminController::class, 'updateBanner']);
                    Route::delete('/banners/{id}', [MarketingAdminController::class, 'destroyBanner']);

                    Route::post('/push-notifications', [MarketingAdminController::class, 'sendNotification']);

                    // Food-category chips (customer home) — DB managed
                    Route::get('/food-categories', [FoodCategoryAdminController::class, 'index']);
                    Route::post('/food-categories/upload-image', [FoodCategoryAdminController::class, 'uploadImage']);
                    Route::post('/food-categories', [FoodCategoryAdminController::class, 'store']);
                    Route::put('/food-categories/{id}', [FoodCategoryAdminController::class, 'update']);
                    Route::patch('/food-categories/{id}/status', [FoodCategoryAdminController::class, 'toggleStatus']);
                    Route::delete('/food-categories/{id}', [FoodCategoryAdminController::class, 'destroy']);
                });

                // Full Order Pipeline Operations & Manual Dispatch
                Route::get('/orders', [OrderAdminController::class, 'index']);
                Route::get('/orders/{id}', [OrderAdminController::class, 'show']);
                Route::get('/orders/{id}/timeline', [OrderAdminController::class, 'timeline']);
                Route::patch('/orders/{id}/status', [OrderAdminController::class, 'updateStatus']);
                Route::match(['post', 'patch'], '/orders/{id}/assign-delivery', [OrderAdminController::class, 'assignDelivery']);
                Route::match(['post', 'patch'], '/orders/{id}/assign-rider', [OrderAdminController::class, 'assignDelivery']);
                Route::match(['post', 'patch'], '/orders/{id}/reassign-delivery', [OrderAdminController::class, 'reassignDelivery']);
                Route::match(['post', 'patch'], '/orders/{id}/reassign-rider', [OrderAdminController::class, 'reassignDelivery']);
                Route::post('/orders/{id}/cancel', [OrderAdminController::class, 'cancel']);

                // Admin Finance screen (summary, settlements, commissions) under /admin/finance
                Route::prefix('finance')->group(function () {
                    Route::get('/summary', [FinanceScreenController::class, 'summary']);
                    Route::get('/settlements', [FinanceScreenController::class, 'settlements']);
                    Route::post('/settlements/{id}/process', [FinanceScreenController::class, 'processSettlement']);
                    Route::get('/commissions', [FinanceScreenController::class, 'commissions']);
                    Route::put('/commissions/{id}', [FinanceScreenController::class, 'updateCommission']);
                    Route::get('/refunds', [FinanceScreenController::class, 'refunds']);
                    Route::get('/cod-reports', [FinanceScreenController::class, 'codReports']);
                    Route::get('/delivery-charge-rules', [FinanceScreenController::class, 'deliveryChargeRules']);
                    Route::put('/delivery-charge-rules', [FinanceScreenController::class, 'updateDeliveryChargeRules']);
                });

                // Financial Operations, Settlements & Refunds
                Route::get('/payments', [FinanceAdminController::class, 'payments']);
                Route::get('/refunds', [FinanceAdminController::class, 'refunds']);
                Route::post('/refunds/process', [FinanceAdminController::class, 'processRefund']);
                Route::get('/cod/collections', [FinanceAdminController::class, 'codCollections']);
                Route::patch('/cod/verify-deposit/{id}', [FinanceAdminController::class, 'verifyCodDeposit']);

                // Support Desk Management
                Route::prefix('support')->group(function () {
                    Route::get('/tickets', [SupportAdminController::class, 'index']);
                    Route::get('/tickets/{id}', [SupportAdminController::class, 'show']);
                    Route::patch('/tickets/{id}/assign', [SupportAdminController::class, 'assign']);
                    Route::patch('/tickets/{id}/status', [SupportAdminController::class, 'updateStatus']);
                    Route::post('/tickets/{id}/replies', [SupportAdminController::class, 'reply']);
                    Route::post('/tickets/{id}/messages', [SupportAdminController::class, 'addMessage']);
                });

                // Review Moderation & Audit
                Route::prefix('reviews')->group(function () {
                    Route::get('/', [ReviewAdminController::class, 'index']);
                    Route::patch('/{id}/toggle-visibility', [ReviewAdminController::class, 'toggleVisibility']);
                });

                // Admin Dashboard home screen
                Route::prefix('dashboard')->group(function () {
                    Route::get('/kpis', [DashboardController::class, 'kpis']);
                    Route::get('/order-overview', [DashboardController::class, 'orderOverview']);
                    Route::get('/live-operations', [DashboardController::class, 'liveOperations']);
                    Route::get('/recent-orders', [DashboardController::class, 'recentOrders']);
                    Route::get('/sales-analytics', [DashboardController::class, 'salesAnalytics']);
                });

                // Platform Analytics & Reports
                Route::prefix('analytics')->group(function () {
                    Route::get('/dashboard', [AnalyticsAdminController::class, 'dashboard']);
                });

                // Admin Reports screen: unified daily report per type (orders/commission/cod)
                Route::prefix('reports')->group(function () {
                    Route::get('/{type}/export', [ReportScreenController::class, 'exportCsv']);
                    Route::get('/{type}/export-csv', [ReportScreenController::class, 'exportCsv']);
                    Route::get('/{type}/export-excel', [ReportScreenController::class, 'exportExcel']);
                    Route::get('/{type}', [ReportScreenController::class, 'data']);
                });

                // Merchant Payout Settlements
                Route::prefix('settlements')->group(function () {
                    Route::get('/', [SettlementAdminController::class, 'index']);
                    Route::post('/generate', [SettlementAdminController::class, 'generate']);
                    Route::patch('/{id}/process-payout', [SettlementAdminController::class, 'processPayout']);
                });

                // Platform Settings screen
                Route::prefix('settings')->group(function () {
                    Route::get('/general', [SettingsController::class, 'getSettings']);
                    Route::put('/general', [SettingsController::class, 'updateSettings']);
                    Route::get('/orders', [SettingsController::class, 'getOrderSettings']);
                    Route::put('/orders', [SettingsController::class, 'updateOrderSettings']);
                    Route::get('/delivery', [SettingsController::class, 'getDeliverySettings']);
                    Route::put('/delivery', [SettingsController::class, 'updateDeliverySettings']);
                    Route::get('/payments', [SettingsController::class, 'getPaymentSettings']);
                    Route::put('/payments', [SettingsController::class, 'updatePaymentSettings']);
                    Route::get('/notifications', [SettingsController::class, 'getNotificationSettings']);
                    Route::put('/notifications', [SettingsController::class, 'updateNotificationSettings']);
                    Route::get('/service-areas', [SettingsController::class, 'getServiceAreas']);
                    Route::post('/service-areas', [SettingsController::class, 'createServiceArea']);
                    Route::put('/service-areas/{id}', [SettingsController::class, 'updateServiceArea']);
                    Route::delete('/service-areas/{id}', [SettingsController::class, 'deleteServiceArea']);
                });

                // Central System Log & Monitoring Center
                Route::prefix('system-logs')->group(function () {
                    Route::get('/overview', [\App\Http\Controllers\Api\V1\Admin\SystemLogAdminController::class, 'overview']);
                    Route::get('/export', [\App\Http\Controllers\Api\V1\Admin\SystemLogAdminController::class, 'export']);
                    Route::get('/', [\App\Http\Controllers\Api\V1\Admin\SystemLogAdminController::class, 'index']);
                    Route::get('/{id}', [\App\Http\Controllers\Api\V1\Admin\SystemLogAdminController::class, 'show']);
                });

                // Live Fleet Telemetry Map
                Route::get('/fleet/live-map', [FleetAdminController::class, 'liveMap']);

                // SMS & WhatsApp Communication Audit Logs
                Route::get('/logs/sms', [SmsLogAdminController::class, 'index']);
            });
        });
    });
});
