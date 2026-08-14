<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Backs the admin Reports screen (src/pages/reports/ReportsDashboard.jsx) under
 * /admin/reports/{type}. All three report types (orders / commission / cod) share
 * the same daily-row shape, so they resolve to one aggregation.
 */
class ReportScreenController extends Controller
{
    public function data(Request $request, string $type): JsonResponse
    {
        return ApiResponse::success(
            $this->buildRows($request->input('range', 'LAST_7_DAYS')),
            ucfirst($type).' report retrieved.'
        );
    }

    public function exportCsv(Request $request, string $type): StreamedResponse
    {
        return $this->streamCsv($type, $this->buildRows($request->input('range', 'LAST_7_DAYS')));
    }

    public function exportExcel(Request $request, string $type): StreamedResponse
    {
        // No spreadsheet library wired; deliver a CSV payload (opens in Excel).
        return $this->streamCsv($type, $this->buildRows($request->input('range', 'LAST_7_DAYS')));
    }

    protected function buildRows(string $range): array
    {
        [$start, $end] = $this->resolveRange($range);

        $orders = Order::whereBetween('placed_at', [$start->toDateTimeString(), $end->toDateTimeString()])->get();

        $byDate = $orders->groupBy(fn ($o) => ($o->placed_at ?? $o->created_at)->toDateString());

        $rows = $byDate->map(function ($group, $date) {
            $delivered = $group->where('status', OrderStatus::DELIVERED);
            $cancelled = $group->whereIn('status', [OrderStatus::CANCELLED, OrderStatus::REJECTED, OrderStatus::FAILED]);

            return [
                'date' => $date,
                'total_orders' => $delivered->count(),
                'gross_sales' => (float) $delivered->sum('total_amount'),
                'dastak_commission' => (float) $delivered->sum('commission_amount'),
                'cod_amount' => (float) $delivered->where('payment_mode', \App\Enums\PaymentMode::COD)->sum('total_amount'),
                'cancelled_orders' => $cancelled->count(),
            ];
        })->values()->sortByDesc('date')->values()->all();

        return $rows;
    }

    protected function resolveRange(string $range): array
    {
        return match (strtoupper($range)) {
            'TODAY' => [Carbon::today(), Carbon::today()->endOfDay()],
            'THIS_MONTH' => [Carbon::now()->startOfMonth(), Carbon::now()->endOfDay()],
            'LAST_MONTH' => [Carbon::now()->subMonth()->startOfMonth(), Carbon::now()->subMonth()->endOfMonth()],
            default => [Carbon::today()->subDays(6), Carbon::now()->endOfDay()], // LAST_7_DAYS
        };
    }

    protected function streamCsv(string $type, array $rows): StreamedResponse
    {
        $filename = 'Dastak_'.$type.'_report_'.date('Ymd_His').'.csv';
        $headers = ['date', 'total_orders', 'gross_sales', 'dastak_commission', 'cod_amount', 'cancelled_orders'];

        return response()->streamDownload(function () use ($rows, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($rows as $row) {
                fputcsv($out, array_map(fn ($h) => $row[$h] ?? '', $headers));
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
