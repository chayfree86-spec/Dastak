<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\ReportExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportAdminController extends Controller
{
    public function __construct(
        protected ReportExportService $reportExportService
    ) {}

    public function orders(Request $request): JsonResponse
    {
        $query = Order::with(['restaurant', 'customer', 'deliveryBoy'])->latest('placed_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('restaurant_id')) {
            $query->where('restaurant_id', $request->input('restaurant_id'));
        }
        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('placed_at', [$request->input('from_date') . ' 00:00:00', $request->input('to_date') . ' 23:59:59']);
        }

        $orders = $query->paginate((int) $request->input('per_page', 20));

        return ApiResponse::paginated(
            paginator: $orders,
            resourceClass: OrderResource::class,
            message: 'Orders report data retrieved.'
        );
    }

    public function exportOrders(Request $request): StreamedResponse
    {
        return $this->reportExportService->exportOrdersCsv($request->all());
    }

    public function sales(Request $request): JsonResponse
    {
        $query = Order::where('status', OrderStatus::DELIVERED)
            ->selectRaw('DATE(placed_at) as order_date, restaurant_id, COUNT(id) as total_orders, SUM(subtotal) as gross_sales, SUM(commission_amount) as total_commission, SUM(tax_amount) as total_tax, SUM(restaurant_payout_amount) as net_payout')
            ->groupBy('order_date', 'restaurant_id')
            ->with('restaurant')
            ->orderBy('order_date', 'desc');

        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('placed_at', [$request->input('from_date') . ' 00:00:00', $request->input('to_date') . ' 23:59:59']);
        }

        $sales = $query->paginate((int) $request->input('per_page', 20));

        return ApiResponse::success($sales, 'Sales revenue report retrieved.');
    }

    public function exportSales(Request $request): StreamedResponse
    {
        return $this->reportExportService->exportSalesCsv($request->all());
    }
}
