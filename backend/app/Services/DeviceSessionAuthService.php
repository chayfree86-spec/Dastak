<?php

namespace App\Services;

use App\Enums\AccountStatus;
use App\Models\AppDeviceSession;
use App\Models\AppVerificationSession;
use App\Models\CustomerProfile;
use App\Models\DeliveryBoyProfile;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\SystemLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class DeviceSessionAuthService
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Start a verification session with 1-Mobile + Multi-PC device binding.
     *
     * Rule:
     * - Mobile Phone: Max 1 active mobile phone per account. A 2nd mobile phone is blocked unless "Change Device" is tapped.
     * - PC / Desktop: Multi-PC allowed! PCs can connect freely alongside the 1 active mobile phone.
     */
    public function startVerification(
        string $mobile,
        string $deviceId,
        string $appType = 'customer',
        ?string $deviceName = 'Mobile Device',
        string $devicePlatform = 'mobile'
    ): array {
        // Normalize: strip non-digits and any +91 / leading-0 country prefix,
        // keeping the core 10-digit subscriber number.
        $digits = preg_replace('/\D/', '', $mobile);
        if (strlen($digits) > 10) {
            $digits = substr($digits, -10);
        }
        $cleanMobile = $digits;

        // Strong Indian mobile validation (DoT numbering): exactly 10 digits,
        // first digit 6-9, and not a single repeated digit (e.g. 9999999999).
        // Blocks junk like 1234567890 / 0000000000 / landline-style numbers.
        if (! preg_match('/^[6-9]\d{9}$/', $cleanMobile) || preg_match('/^(\d)\1{9}$/', $cleanMobile)) {
            throw ValidationException::withMessages([
                'mobile' => ['Please enter a valid 10-digit Indian mobile number (must start with 6, 7, 8 or 9).'],
            ]);
        }
        $deviceHash = hash('sha256', trim($deviceId));
        $platform = in_array(strtolower($devicePlatform), ['desktop', 'web_pc', 'pc']) ? 'desktop' : 'mobile';

        // Single Mobile Phone Enforcement:
        // Only if attempting to login from a MOBILE device, check if another MOBILE device is already active.
        if ($platform === 'mobile') {
            $activeMobileSession = AppDeviceSession::where('mobile_number', $cleanMobile)
                ->where('app_type', $appType)
                ->where('device_platform', 'mobile')
                ->where('status', 'ACTIVE')
                ->first();

            if ($activeMobileSession && $activeMobileSession->device_identifier_hash !== $deviceHash) {
                SystemLogger::warning(
                    category: 'AUTH',
                    event: strtoupper($appType) . '_MOBILE_SESSION_REJECTED',
                    description: "Mobile login blocked for {$cleanMobile}: active permanent session exists on another phone ({$activeMobileSession->device_name}).",
                    params: [
                        'mobile' => '******' . substr($cleanMobile, -4),
                        'app_type' => $appType,
                        'active_session_id' => $activeMobileSession->id,
                        'attempting_device_hash' => substr($deviceHash, 0, 16),
                        'reason' => 'MOBILE_SESSION_ALREADY_ACTIVE_ON_ANOTHER_PHONE',
                    ]
                );

                return [
                    'session_active_elsewhere' => true,
                    'active_device_name' => $activeMobileSession->device_name ?: 'Another Mobile Phone',
                    'device_platform' => 'mobile',
                    'message' => 'This mobile number is already active on another mobile phone.',
                    'instructions' => 'To use this mobile number on this phone, open Dastak on your existing phone and go to Settings → Change Device.',
                ];
            }
        }

        // Generate unpredictable public ID & secure 6-digit OTP
        $sessionPublicId = 'vs_' . bin2hex(random_bytes(16));
        $otp = (string) random_int(100000, 999999);
        $otpHash = Hash::make($otp);

        // Revoke any previous pending verification sessions for this mobile & appType
        AppVerificationSession::where('mobile_number', $cleanMobile)
            ->where('app_type', $appType)
            ->where('status', 'PENDING')
            ->update([
                'status' => 'REVOKED',
                'revoked_at' => now(),
            ]);

        // Create new verification session record
        $session = AppVerificationSession::create([
            'session_public_id' => $sessionPublicId,
            'app_type' => $appType,
            'mobile_number' => $cleanMobile,
            'device_identifier_hash' => $deviceHash,
            'device_platform' => $platform,
            'otp_hash' => $otpHash,
            'otp_plain' => $otp, // Returned in active flow for UI prefill
            'status' => 'PENDING',
            'attempts' => 0,
            'last_activity_at' => now(),
            'metadata' => [
                'device_name' => $deviceName,
                'device_platform' => $platform,
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ],
        ]);

        $user = User::where('mobile', $cleanMobile)->first();

        // Check if this device already has an active trusted session for this user
        $trustedSession = null;
        if ($user) {
            $trustedSession = AppDeviceSession::where('mobile_number', $cleanMobile)
                ->where('app_type', $appType)
                ->where('device_identifier_hash', $deviceHash)
                ->where('status', 'ACTIVE')
                ->first();
        }

        // System Logger Event
        SystemLogger::info(
            category: 'AUTH',
            event: strtoupper($appType) . '_VERIFICATION_STARTED',
            description: "Verification started for {$cleanMobile} on {$deviceName} ({$platform}).",
            params: [
                'session_ref' => $sessionPublicId,
                'mobile' => '******' . substr($cleanMobile, -4),
                'app_type' => $appType,
                'platform' => $platform,
                'is_existing_user' => (bool) $user,
            ]
        );

        return [
            'session_active_elsewhere' => false,
            'verification_session_id' => $sessionPublicId,
            'mobile' => $cleanMobile,
            'otp' => $otp, // Pre-filled directly in the UI as requested
            'device_platform' => $platform,
            'is_existing_user' => (bool) $user,
            'user_name' => $user?->name,
            'has_custom_pin' => ! is_null($user?->login_pin),
            'requires_name' => ! $user,
            'is_trusted_device' => (bool) $trustedSession,
            'message' => $user ? "Welcome back, {$user->name}!" : 'Please enter your name to complete registration.',
        ];
    }

    /**
     * Resend/Regenerate OTP for an active pending verification session.
     */
    public function resendOtp(string $sessionPublicId, string $deviceId): array
    {
        $deviceHash = hash('sha256', trim($deviceId));

        $session = AppVerificationSession::where('session_public_id', $sessionPublicId)->first();

        if (! $session || ! $session->isPending()) {
            throw ValidationException::withMessages([
                'session' => ['Verification session has expired or is invalid. Please start again.'],
            ]);
        }

        if ($session->device_identifier_hash !== $deviceHash) {
            throw ValidationException::withMessages([
                'device' => ['Security verification failed: Device identifier mismatch.'],
            ]);
        }

        $otp = (string) random_int(100000, 999999);
        $otpHash = Hash::make($otp);

        $session->update([
            'otp_hash' => $otpHash,
            'otp_plain' => $otp,
            'last_activity_at' => now(),
        ]);

        return [
            'verification_session_id' => $sessionPublicId,
            'otp' => $otp,
            'message' => 'New verification code generated.',
        ];
    }

    /**
     * Verify OTP and establish permanent device-bound session.
     */
    public function verifyOtp(
        string $sessionPublicId,
        string $otp,
        string $deviceId,
        ?string $name = null,
        ?string $deviceName = 'Device',
        ?string $pin = null
    ): array {
        $deviceHash = hash('sha256', trim($deviceId));
        $cleanOtp = trim($otp);

        $session = AppVerificationSession::where('session_public_id', $sessionPublicId)->first();

        if (! $session) {
            throw ValidationException::withMessages([
                'session' => ['Verification session not found. Please enter your mobile number again.'],
            ]);
        }

        if ($session->status === 'LOCKED') {
            throw ValidationException::withMessages([
                'otp' => ['Maximum OTP attempts exceeded. Please restart verification.'],
            ]);
        }

        if (! $session->isPending()) {
            throw ValidationException::withMessages([
                'session' => ['Verification session is no longer active. Please restart verification.'],
            ]);
        }

        if ($session->device_identifier_hash !== $deviceHash) {
            SystemLogger::warning(
                category: 'AUTH',
                event: strtoupper($session->app_type) . '_DEVICE_MISMATCH',
                description: "Cross-device OTP verification attempt rejected for session {$sessionPublicId}.",
                params: ['session_ref' => $sessionPublicId, 'mobile' => '******' . substr($session->mobile_number, -4)]
            );

            throw ValidationException::withMessages([
                'device' => ['Security verification failed: Device identifier mismatch.'],
            ]);
        }

        // Verify OTP Hash
        $isValid = Hash::check($cleanOtp, $session->otp_hash) || ($session->otp_plain && $cleanOtp === $session->otp_plain);

        if (! $isValid) {
            $session->increment('attempts');

            if ($session->attempts >= 5) {
                $session->update(['status' => 'LOCKED', 'revoked_at' => now()]);
            }

            SystemLogger::warning(
                category: 'AUTH',
                event: strtoupper($session->app_type) . '_OTP_FAILED',
                description: "Incorrect OTP entered for {$session->mobile_number} (Attempt {$session->attempts}/5).",
                params: ['session_ref' => $sessionPublicId, 'attempts' => $session->attempts]
            );

            throw ValidationException::withMessages([
                'otp' => ['Invalid verification code. Please check and try again.'],
            ]);
        }

        // Mark verification session as VERIFIED
        $session->update([
            'status' => 'VERIFIED',
            'verified_at' => now(),
            'otp_plain' => null,
        ]);

        return DB::transaction(function () use ($session, $deviceHash, $deviceName, $name, $pin) {
            $mobile = $session->mobile_number;
            $appType = $session->app_type;
            $platform = $session->device_platform ?: 'mobile';
            $isNewUser = false;

            $user = User::where('mobile', $mobile)->first();

            if (! $user) {
                $isNewUser = true;
                $trimmedName = trim($name ?? '');
                if ($appType === 'customer' && empty($trimmedName)) {
                    throw ValidationException::withMessages([
                        'name' => ['Please enter your full name to complete registration.'],
                    ]);
                }

                $userName = ! empty($trimmedName) ? $trimmedName : ($appType === 'delivery_boy' ? 'Rider ' . substr($mobile, -4) : ($appType === 'restaurant_partner' ? 'Partner ' . substr($mobile, -4) : 'Customer ' . substr($mobile, -4)));

                $user = User::create([
                    'name' => $userName,
                    'mobile' => $mobile,
                    'email' => $mobile . '@dastak.local',
                    'password' => Hash::make(bin2hex(random_bytes(16))),
                    // PIN chosen during registration (customer app). Null if not provided.
                    'login_pin' => ($pin && ctype_digit($pin) && strlen($pin) === 4) ? Hash::make($pin) : null,
                    'status' => AccountStatus::ACTIVE,
                    'mobile_verified_at' => now(),
                    'last_login_at' => now(),
                ]);

                // Assign matching role
                $roleSlug = $appType === 'delivery_boy' ? 'delivery_boy' : ($appType === 'restaurant_partner' ? 'restaurant_owner' : 'customer');
                $role = Role::firstOrCreate(['slug' => $roleSlug], ['name' => ucfirst(str_replace('_', ' ', $roleSlug))]);
                $user->roles()->sync([$role->id]);

                // Create profile if customer or delivery boy
                if ($appType === 'customer') {
                    CustomerProfile::firstOrCreate(['user_id' => $user->id], ['loyalty_points' => 100]);
                } elseif ($appType === 'delivery_boy') {
                    DeliveryBoyProfile::firstOrCreate(['user_id' => $user->id], [
                        'vehicle_type' => 'BIKE',
                        'is_online' => true,
                        'is_available' => true,
                        'rating' => 5.0,
                    ]);
                }
            } else {
                $userUpdates = ['last_login_at' => now(), 'mobile_verified_at' => now()];
                if (! empty(trim($name ?? '')) && (str_starts_with($user->name, 'Customer ') || empty($user->name))) {
                    $userUpdates['name'] = trim($name);
                }
                // Set the chosen PIN only if the account doesn't already have one.
                if ($pin && ctype_digit($pin) && strlen($pin) === 4 && empty($user->login_pin)) {
                    $userUpdates['login_pin'] = Hash::make($pin);
                }
                $user->update($userUpdates);
            }

            // Session Revocation Strategy:
            // 1. If this is a Mobile Phone -> Revoke previous mobile phone session (enforces 1 mobile phone).
            // 2. If this is a Desktop/PC -> Only revoke previous session on this SAME exact PC (multi-PC allowed).
            if ($platform === 'mobile') {
                AppDeviceSession::where('mobile_number', $mobile)
                    ->where('app_type', $appType)
                    ->where('device_platform', 'mobile')
                    ->where('status', 'ACTIVE')
                    ->update([
                        'status' => 'REVOKED',
                        'revoked_at' => now(),
                        'revocation_reason' => 'NEW_MOBILE_PHONE_SESSION_ESTABLISHED',
                    ]);
            } else {
                AppDeviceSession::where('mobile_number', $mobile)
                    ->where('app_type', $appType)
                    ->where('device_identifier_hash', $deviceHash)
                    ->where('status', 'ACTIVE')
                    ->update([
                        'status' => 'REVOKED',
                        'revoked_at' => now(),
                        'revocation_reason' => 'PC_SESSION_RENEWED',
                    ]);
            }

            // Generate cryptographically secure permanent session token
            $rawToken = 'dsk_sess_' . bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $rawToken);

            $deviceSession = AppDeviceSession::create([
                'user_id' => $user->id,
                'app_type' => $appType,
                'mobile_number' => $mobile,
                'session_token_hash' => $tokenHash,
                'device_identifier_hash' => $deviceHash,
                'device_name' => $deviceName,
                'device_platform' => $platform,
                'status' => 'ACTIVE',
                'last_seen_at' => now(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            // Generate Sanctum access token matching device
            $sanctumToken = $user->createToken($deviceName ?: ($appType . ' App'))->plainTextToken;

            // System Log Event
            SystemLogger::info(
                category: 'AUTH',
                event: strtoupper($appType) . '_SESSION_CREATED',
                description: "Permanent device session created for {$user->name} (+91 {$mobile}) on {$deviceName} ({$platform}).",
                params: [
                    'actor_type' => strtoupper($appType),
                    'actor_id' => $user->id,
                    'actor_name' => $user->name,
                    'session_id' => $deviceSession->id,
                    'device_name' => $deviceName,
                    'platform' => $platform,
                    'is_new_user' => $isNewUser,
                ]
            );

            return [
                'token' => $sanctumToken,
                'session_token' => $rawToken,
                'user' => $user->load('roles.permissions'),
                'is_new_user' => $isNewUser,
                'device_platform' => $platform,
                'message' => 'Authenticated successfully.',
            ];
        });
    }

    /**
     * Verify 4-Digit PIN for existing registered customer.
     * Default PIN is the last 4 digits of mobile number if not customized.
     */
    public function verifyPin(
        string $sessionPublicId,
        string $pin,
        string $deviceId,
        ?string $deviceName = 'Customer App'
    ): array {
        $deviceHash = hash('sha256', trim($deviceId));
        $cleanPin = trim($pin);

        if (strlen($cleanPin) !== 4 || ! ctype_digit($cleanPin)) {
            throw ValidationException::withMessages([
                'pin' => ['Please enter a valid 4-digit numeric PIN.'],
            ]);
        }

        $session = AppVerificationSession::where('session_public_id', $sessionPublicId)->first();

        if (! $session) {
            throw ValidationException::withMessages([
                'session' => ['Verification session not found. Please enter your mobile number again.'],
            ]);
        }

        if ($session->status === 'LOCKED') {
            throw ValidationException::withMessages([
                'pin' => ['Maximum PIN attempts exceeded. Please login with OTP.'],
            ]);
        }

        if (! $session->isPending()) {
            throw ValidationException::withMessages([
                'session' => ['Verification session is no longer active. Please restart.'],
            ]);
        }

        $mobile = $session->mobile_number;
        $appType = $session->app_type;
        $platform = $session->device_platform ?: 'mobile';

        $user = User::where('mobile', $mobile)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'pin' => ['Customer account not found. Please register as a new customer.'],
            ]);
        }

        // Default PIN is the last 4 digits of mobile number
        $defaultPin = substr($mobile, -4);

        $isPinValid = false;
        if (! empty($user->login_pin)) {
            $isPinValid = Hash::check($cleanPin, $user->login_pin);
        } else {
            // Default PIN fallback: last 4 digits of mobile or password check
            $isPinValid = ($cleanPin === $defaultPin) || Hash::check($cleanPin, $user->password);
        }

        if (! $isPinValid) {
            $session->increment('attempts');

            if ($session->attempts >= 5) {
                $session->update(['status' => 'LOCKED', 'revoked_at' => now()]);
            }

            SystemLogger::warning(
                category: 'AUTH',
                event: strtoupper($appType) . '_PIN_FAILED',
                description: "Incorrect PIN entered for {$mobile} (Attempt {$session->attempts}/5).",
                params: ['session_ref' => $sessionPublicId, 'attempts' => $session->attempts]
            );

            throw ValidationException::withMessages([
                'pin' => [
                    ! empty($user->login_pin)
                        ? 'Incorrect 4-digit PIN. Please try again.'
                        : "Incorrect 4-digit PIN. Default PIN is the last 4 digits ({$defaultPin}) of your mobile number.",
                ],
            ]);
        }

        // Mark verification session as VERIFIED
        $session->update([
            'status' => 'VERIFIED',
            'verified_at' => now(),
            'otp_plain' => null,
        ]);

        return DB::transaction(function () use ($session, $user, $deviceHash, $deviceName, $platform, $mobile, $appType, $cleanPin) {
            // If user's login_pin was null, save this verified PIN
            if (empty($user->login_pin)) {
                $user->update(['login_pin' => Hash::make($cleanPin)]);
            }

            $user->update(['last_login_at' => now(), 'mobile_verified_at' => now()]);

            // Session Revocation Strategy:
            if ($platform === 'mobile') {
                AppDeviceSession::where('mobile_number', $mobile)
                    ->where('app_type', $appType)
                    ->where('device_platform', 'mobile')
                    ->where('status', 'ACTIVE')
                    ->update([
                        'status' => 'REVOKED',
                        'revoked_at' => now(),
                        'revocation_reason' => 'NEW_MOBILE_PHONE_SESSION_ESTABLISHED',
                    ]);
            } else {
                AppDeviceSession::where('mobile_number', $mobile)
                    ->where('app_type', $appType)
                    ->where('device_identifier_hash', $deviceHash)
                    ->where('status', 'ACTIVE')
                    ->update([
                        'status' => 'REVOKED',
                        'revoked_at' => now(),
                        'revocation_reason' => 'PC_SESSION_RENEWED',
                    ]);
            }

            // Generate cryptographically secure permanent session token
            $rawToken = 'dsk_sess_' . bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $rawToken);

            $deviceSession = AppDeviceSession::create([
                'user_id' => $user->id,
                'app_type' => $appType,
                'mobile_number' => $mobile,
                'session_token_hash' => $tokenHash,
                'device_identifier_hash' => $deviceHash,
                'device_name' => $deviceName,
                'device_platform' => $platform,
                'status' => 'ACTIVE',
                'last_seen_at' => now(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            // Generate Sanctum access token matching device
            $sanctumToken = $user->createToken($deviceName ?: ($appType . ' App'))->plainTextToken;

            // System Log Event
            SystemLogger::info(
                category: 'AUTH',
                event: strtoupper($appType) . '_PIN_LOGIN_SUCCESS',
                description: "User {$user->name} (+91 {$mobile}) signed in with PIN on {$deviceName} ({$platform}).",
                params: [
                    'actor_type' => strtoupper($appType),
                    'actor_id' => $user->id,
                    'actor_name' => $user->name,
                    'session_id' => $deviceSession->id,
                    'device_name' => $deviceName,
                    'platform' => $platform,
                ]
            );

            return [
                'token' => $sanctumToken,
                'session_token' => $rawToken,
                'user' => $user->load('roles.permissions'),
                'is_new_user' => false,
                'device_platform' => $platform,
                'message' => 'Signed in successfully with PIN.',
            ];
        });
    }

    /**
     * Validate a permanent device session token.
     */
    public function validateSession(string $rawToken, string $deviceId, string $appType = 'customer'): array
    {
        $tokenHash = hash('sha256', trim($rawToken));
        $deviceHash = hash('sha256', trim($deviceId));

        $session = AppDeviceSession::where('session_token_hash', $tokenHash)->first();

        if (! $session) {
            throw ValidationException::withMessages([
                'session' => ['SESSION_INVALID: No active session found for this token.'],
            ]);
        }

        if ($session->status !== 'ACTIVE') {
            throw ValidationException::withMessages([
                'session' => ['SESSION_REVOKED: This session was logged out or moved to another device.'],
            ]);
        }

        if ($session->device_identifier_hash !== $deviceHash) {
            throw ValidationException::withMessages([
                'session' => ['SESSION_DEVICE_MISMATCH: Session does not belong to this device.'],
            ]);
        }

        if ($session->app_type !== $appType) {
            throw ValidationException::withMessages([
                'session' => ['SESSION_APP_MISMATCH: Session is not valid for this application.'],
            ]);
        }

        // Touch last seen timestamp
        $session->update(['last_seen_at' => now()]);

        $user = User::with('roles.permissions')->find($session->user_id);

        if (! $user || $user->status !== AccountStatus::ACTIVE) {
            $session->update(['status' => 'REVOKED', 'revoked_at' => now(), 'revocation_reason' => 'USER_INACTIVE_OR_SUSPENDED']);
            throw ValidationException::withMessages([
                'user' => ['Account is suspended or deactivated.'],
            ]);
        }

        return [
            'user' => $user,
            'device_session' => $session,
            'device_name' => $session->device_name,
            'device_platform' => $session->device_platform,
        ];
    }

    /**
     * Perform "Change Device" / Revoke active device session for a user.
     */
    public function changeDevice(User $user, string $deviceId, string $appType = 'customer', ?string $reason = 'MANUAL_DEVICE_CHANGE'): void
    {
        $deviceHash = hash('sha256', trim($deviceId));

        // Revoke the active session on this device
        AppDeviceSession::where('user_id', $user->id)
            ->where('app_type', $appType)
            ->where('device_identifier_hash', $deviceHash)
            ->where('status', 'ACTIVE')
            ->update([
                'status' => 'REVOKED',
                'revoked_at' => now(),
                'revocation_reason' => $reason,
            ]);

        // Revoke sanctum tokens associated with this user
        $user->tokens()->delete();

        SystemLogger::info(
            category: 'AUTH',
            event: strtoupper($appType) . '_DEVICE_REVOKED',
            description: "Active device session revoked for {$user->name} (+91 {$user->mobile}) by {$reason}.",
            params: [
                'user_id' => $user->id,
                'mobile' => '******' . substr($user->mobile, -4),
                'reason' => $reason,
            ]
        );
    }

    /**
     * Get active device session details for a user.
     */
    public function getUserActiveDeviceSession(User|int|string $userOrMobile, string $appType = 'customer'): ?array
    {
        $query = AppDeviceSession::where('app_type', $appType)
            ->where('status', 'ACTIVE');

        if ($userOrMobile instanceof User) {
            $query->where('user_id', $userOrMobile->id);
        } elseif (is_numeric($userOrMobile) && strlen((string) $userOrMobile) < 9) {
            $query->where('user_id', (int) $userOrMobile);
        } else {
            $digits = preg_replace('/\D/', '', (string) $userOrMobile);
            if (strlen($digits) > 10) {
                $digits = substr($digits, -10);
            }
            $query->where('mobile_number', $digits);
        }

        $session = $query->latest('id')->first();

        if (! $session) {
            return null;
        }

        return [
            'id' => $session->id,
            'user_id' => $session->user_id,
            'mobile_number' => $session->mobile_number,
            'device_name' => $session->device_name,
            'device_platform' => $session->device_platform,
            'status' => $session->status,
            'created_at' => $session->created_at?->toIso8601String(),
            'last_seen_at' => $session->last_seen_at?->toIso8601String(),
        ];
    }

    /**
     * Admin force-revoke all active device sessions for a user or mobile number.
     */
    public function adminRevokeUserSessions(User|int|string $userOrMobile, ?string $appType = null, string $reason = 'ADMIN_MANUAL_REVOKE'): int
    {
        $query = AppDeviceSession::where('status', 'ACTIVE');
        $userId = null;
        $mobile = null;
        $userName = 'User';

        if ($userOrMobile instanceof User) {
            $query->where('user_id', $userOrMobile->id);
            $userId = $userOrMobile->id;
            $mobile = $userOrMobile->mobile;
            $userName = $userOrMobile->name;
        } elseif (is_numeric($userOrMobile) && strlen((string) $userOrMobile) < 9) {
            $userId = (int) $userOrMobile;
            $query->where('user_id', $userId);
            $user = User::find($userId);
            if ($user) {
                $mobile = $user->mobile;
                $userName = $user->name;
            }
        } else {
            $digits = preg_replace('/\D/', '', (string) $userOrMobile);
            if (strlen($digits) > 10) {
                $digits = substr($digits, -10);
            }
            $mobile = $digits;
            $query->where('mobile_number', $digits);
            $user = User::where('mobile', $digits)->first();
            if ($user) {
                $userId = $user->id;
                $userName = $user->name;
            }
        }

        if ($appType) {
            $query->where('app_type', $appType);
        }

        $revokedCount = $query->update([
            'status' => 'REVOKED',
            'revoked_at' => now(),
            'revocation_reason' => $reason,
        ]);

        // Revoke Sanctum tokens if user ID is known
        if ($userId) {
            DB::table('personal_access_tokens')
                ->where('tokenable_id', $userId)
                ->where('tokenable_type', User::class)
                ->delete();
        }

        // Also clean up any lingering pending verification sessions
        if ($mobile) {
            AppVerificationSession::where('mobile_number', $mobile)
                ->where('status', 'PENDING')
                ->update(['status' => 'REVOKED', 'revoked_at' => now()]);
        }

        SystemLogger::info(
            category: 'AUTH',
            event: 'ADMIN_DEVICE_SESSION_REVOKED',
            description: "Admin revoked {$revokedCount} active device session(s) for {$userName} (+91 {$mobile}).",
            params: [
                'user_id' => $userId,
                'mobile' => $mobile,
                'app_type' => $appType,
                'revoked_count' => $revokedCount,
                'reason' => $reason,
            ]
        );

        return $revokedCount;
    }
}
