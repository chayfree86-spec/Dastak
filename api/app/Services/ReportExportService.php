<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExportService
{
    public function exportOrdersCsv(array $filters = []): StreamedResponse
    {
        $fileName = 'orders_report_' . date('Ymd_His') . '.csv';

        $query = Order::with(['restaurant', 'customer', 'deliveryBoy'])->latest('placed_at');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['restaurant_id'])) {
            $query->where('restaurant_id', $filters['restaurant_id']);
        }
        if (! empty($filters['from_date']) && ! empty($filters['to_date'])) {
            $query->whereBetween('placed_at', [$filters['from_date'] . ' 00:00:00', $filters['to_date'] . ' 23:59:59']);
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');

            // Header row
            fputcsv($handle, [
                'Order Number',
                'Date',
                'Customer Name',
                'Customer Mobile',
                'Restaurant',
                'Delivery Rider',
                'Status',
                'Payment Mode',
                'Payment Status',
                'Subtotal (INR)',
                'Discount (INR)',
                'Delivery Fee (INR)',
                'Tax (INR)',
                'Total Amount (INR)',
                'Platform Commission (INR)',
                'Restaurant Payout (INR)',
            ]);

            $query->chunk(200, function ($orders) use ($handle) {
                foreach ($orders as $order) {
                    fputcsv($handle, [
                        $order->order_number,
                        $order->placed_at?->format('Y-m-d H:i:s'),
                        $order->customer?->name,
                        $order->customer?->mobile,
                        $order->restaurant?->name,
                        $order->deliveryBoy?->name ?? 'Unassigned',
                        $order->status?->value,
                        $order->payment_mode?->value,
                        $order->payment_status?->value,
                        $order->subtotal,
                        $order->discount_amount,
                        $order->delivery_fee,
                        $order->tax_amount,
                        $order->total_amount,
                        $order->commission_amount,
                        $order->restaurant_payout_amount,
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    public function exportSalesCsv(array $filters = []): StreamedResponse
    {
        $fileName = 'sales_revenue_report_' . date('Ymd_His') . '.csv';

        $query = Order::where('status', OrderStatus::DELIVERED)
            ->selectRaw('DATE(placed_at) as order_date, restaurant_id, COUNT(id) as total_orders, SUM(subtotal) as gross_sales, SUM(commission_amount) as total_commission, SUM(tax_amount) as total_tax, SUM(restaurant_payout_amount) as net_payout')
            ->groupBy('order_date', 'restaurant_id')
            ->with('restaurant')
            ->orderBy('order_date', 'desc');

        if (! empty($filters['from_date']) && ! empty($filters['to_date'])) {
            $query->whereBetween('placed_at', [$filters['from_date'] . ' 00:00:00', $filters['to_date'] . ' 23:59:59']);
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Date',
                'Restaurant Name',
                'Total Delivered Orders',
                'Gross Sales (INR)',
                'Platform Commission (INR)',
                'GST / Tax (INR)',
                'Net Merchant Payout (INR)',
            ]);

            $query->chunk(200, function ($rows) use ($handle) {
                foreach ($rows as $row) {
                    fputcsv($handle, [
                        $row->order_date,
                        $row->restaurant?->name,
                        $row->total_orders,
                        $row->gross_sales,
                        $row->total_commission,
                        $row->total_tax,
                        $row->net_payout,
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }
}
