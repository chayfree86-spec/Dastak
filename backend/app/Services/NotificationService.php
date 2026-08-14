<?php

namespace App\Services;

use App\Enums\DeviceType;
use App\Enums\SmsChannel;
use App\Enums\SmsStatus;
use App\Models\SmsLog;
use App\Models\User;
use App\Models\UserDeviceToken;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function registerDeviceToken(User $user, string $token, string $deviceType = 'ANDROID'): UserDeviceToken
    {
        return UserDeviceToken::updateOrCreate(
            ['user_id' => $user->id, 'fcm_token' => $token],
            [
                'device_type' => DeviceType::tryFrom($deviceType) ?? DeviceType::ANDROID,
                'is_active' => true,
                'last_used_at' => now(),
            ]
        );
    }

    public function removeDeviceToken(User $user, string $token): bool
    {
        return (bool) UserDeviceToken::where('user_id', $user->id)
            ->where('fcm_token', $token)
            ->delete();
    }

    public function sendPushNotification(User $user, string $title, string $body, array $data = []): bool
    {
        $tokens = $user->deviceTokens()->where('is_active', true)->pluck('fcm_token')->toArray();

        if (empty($tokens)) {
            return false;
        }

        // Mock / Production FCM HTTP v1 dispatch
        Log::info("FCM Push Dispatched to User {$user->id} across " . count($tokens) . " devices", [
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        return true;
    }

    public function sendSmsOrWhatsApp(
        string $recipient,
        string $messageBody,
        string $channel = 'SMS',
        ?User $user = null,
        string $templateName = 'GENERAL'
    ): SmsLog {
        // Create log record
        $smsLog = SmsLog::create([
            'user_id' => $user?->id,
            'recipient' => $recipient,
            'channel' => SmsChannel::tryFrom($channel) ?? SmsChannel::SMS,
            'template_name' => $templateName,
            'message_body' => $messageBody,
            'provider' => 'MOCK_FAST2SMS',
            'provider_message_id' => 'MSG-' . uniqid(),
            'status' => SmsStatus::SENT,
        ]);

        Log::info("{$channel} sent to {$recipient}: {$messageBody}");

        return $smsLog;
    }
}
