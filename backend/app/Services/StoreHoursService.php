<?php

namespace App\Services;

use App\Models\SystemSetting;
use Carbon\Carbon;

/**
 * Computes the platform's current ordering availability from admin-configured
 * service hours (stored in system_settings). Rural deployments can run on a
 * daily schedule instead of 24x7.
 *
 * Settings keys:
 *  - service_mode: '24x7' | 'scheduled' | 'closed'
 *  - service_open_time / service_close_time: 'H:i' (used only in 'scheduled')
 *  - service_closed_message: optional custom message shown to customers
 */
class StoreHoursService
{
    protected string $tz = 'Asia/Kolkata';

    public function status(): array
    {
        $mode = SystemSetting::get('service_mode', '24x7');
        $openTime = SystemSetting::get('service_open_time', '09:00');
        $closeTime = SystemSetting::get('service_close_time', '22:00');
        $customMsg = SystemSetting::get('service_closed_message', '');

        $now = Carbon::now($this->tz);

        if ($mode === '24x7') {
            return $this->payload(true, $mode, null, null, $openTime, $closeTime, null, $now);
        }

        if ($mode === 'closed') {
            return $this->payload(
                false, $mode, null, null, $openTime, $closeTime,
                $customMsg ?: 'We are temporarily closed. Please check back soon.',
                $now
            );
        }

        // scheduled
        [$oh, $om] = $this->parseTime($openTime, 9, 0);
        [$ch, $cm] = $this->parseTime($closeTime, 22, 0);

        $todayOpen = $now->copy()->setTime($oh, $om, 0);
        $todayClose = $now->copy()->setTime($ch, $cm, 0);
        $spansMidnight = $todayClose->lessThanOrEqualTo($todayOpen);

        if ($spansMidnight) {
            $todayClose->addDay();
            // A window that started yesterday may still be running past midnight.
            $yOpen = $todayOpen->copy()->subDay();
            $yClose = $todayClose->copy()->subDay();
            if ($now->betweenIncluded($yOpen, $yClose)) {
                return $this->payload(true, $mode, null, $yClose->toIso8601String(), $openTime, $closeTime, null, $now);
            }
        }

        if ($now->betweenIncluded($todayOpen, $todayClose)) {
            return $this->payload(true, $mode, null, $todayClose->toIso8601String(), $openTime, $closeTime, null, $now);
        }

        // Closed now → next opening is today's open (if still ahead) else tomorrow's.
        $nextOpen = $now->lessThan($todayOpen) ? $todayOpen : $todayOpen->copy()->addDay();

        return $this->payload(
            false, $mode, $nextOpen->toIso8601String(), null, $openTime, $closeTime,
            $customMsg ?: null, $now
        );
    }

    public function isOpen(): bool
    {
        return (bool) $this->status()['is_open'];
    }

    protected function parseTime(?string $value, int $defH, int $defM): array
    {
        if (! $value || ! preg_match('/^(\d{1,2}):(\d{2})$/', trim($value), $m)) {
            return [$defH, $defM];
        }
        return [(int) $m[1], (int) $m[2]];
    }

    protected function payload(bool $isOpen, string $mode, ?string $opensAt, ?string $closesAt, ?string $openTime, ?string $closeTime, ?string $message, Carbon $now): array
    {
        return [
            'is_open' => $isOpen,
            'mode' => $mode,
            'opens_at' => $opensAt,
            'closes_at' => $closesAt,
            'open_time' => $openTime,
            'close_time' => $closeTime,
            'message' => $message,
            'server_time' => $now->toIso8601String(),
            'timezone' => $this->tz,
        ];
    }
}
