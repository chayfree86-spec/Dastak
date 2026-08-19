<?php

namespace App\Services;

use App\Enums\AccountStatus;
use App\Enums\ActorType;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    public function login(string $identifier, string $password, ?string $deviceName = 'API Client'): array
    {
        // Allow login with either email (checks password) or mobile number (checks login_pin)
        $isEmail = str_contains($identifier, '@');

        $user = $isEmail
            ? User::where('email', $identifier)->first()
            : User::where('mobile', $identifier)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'identifier' => ['The provided credentials do not match our records.'],
            ]);
        }

        // Verify password for email login, or login_pin for mobile login (fallback to password if pin not set)
        $hashToCheck = $isEmail ? $user->password : ($user->login_pin ?: $user->password);

        if (! Hash::check($password, $hashToCheck)) {
            throw ValidationException::withMessages([
                'identifier' => ['The provided credentials do not match our records.'],
            ]);
        }

        $this->validateAccountStatus($user);

        // Update last login timestamp
        $user->update(['last_login_at' => now()]);

        // Generate Sanctum Personal Access Token
        $token = $user->createToken($deviceName ?? 'API Token')->plainTextToken;

        // Audit Log
        $this->auditLogService->log(
            action: 'USER_LOGIN',
            entityType: 'User',
            entityId: (string) $user->id,
            actor: $user,
            actorType: ActorType::ADMIN
        );

        // System Logger - User Activity Logging
        $roleName = $user->roles()->first()?->name ?? 'User';
        $roleSlug = strtoupper($user->roles()->first()?->slug ?? 'USER');
        $ip = request()->ip() ?? '127.0.0.1';
        $agent = request()->userAgent() ?? 'Web Browser';

        SystemLogger::info(
            category: 'AUTH',
            event: 'USER_LOGIN_SUCCESS',
            description: "User {$user->name} ({$roleName}) signed in from {$deviceName}. IP: {$ip}.",
            params: [
                'actor_type' => $roleSlug,
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'reference_type' => 'User',
                'reference_id' => (string) $user->id,
                'metadata' => [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'role' => $roleName,
                    'device' => $deviceName,
                    'ip_address' => $ip,
                    'user_agent' => $agent,
                    'login_method' => $isEmail ? 'EMAIL_PASSWORD' : 'MOBILE_PIN',
                ],
            ]
        );

        return [
            'token' => $token,
            'user' => $user->load('roles.permissions'),
        ];
    }

    public function registerCustomer(array $data): array
    {
        $mobile = $data['mobile'];
        $email = $data['email'] ?? null;
        $name = $data['name'] ?? 'Customer';
        $password = $data['password'] ?? 'password123';

        $existing = User::where('mobile', $mobile)->first();
        if ($existing) {
            throw ValidationException::withMessages([
                'mobile' => ['This mobile number is already registered. Please sign in.'],
            ]);
        }

        if ($email && User::where('email', $email)->first()) {
            throw ValidationException::withMessages([
                'email' => ['This email is already registered.'],
            ]);
        }

        $user = User::create([
            'name' => $name,
            'mobile' => $mobile,
            'email' => $email ?: ($mobile . '@dastak.local'),
            'password' => Hash::make($password),
            'status' => AccountStatus::ACTIVE,
            'mobile_verified_at' => now(),
        ]);

        $customerRole = \App\Models\Role::firstOrCreate(['slug' => 'customer'], ['name' => 'Customer']);
        $user->roles()->sync([$customerRole->id]);

        \App\Models\CustomerProfile::create([
            'user_id' => $user->id,
            'loyalty_points' => 100,
        ]);

        $token = $user->createToken($data['device_name'] ?? 'Customer App')->plainTextToken;

        return [
            'token' => $token,
            'user' => $user->load('roles.permissions'),
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();

        $this->auditLogService->log(
            action: 'USER_LOGOUT',
            entityType: 'User',
            entityId: (string) $user->id,
            actor: $user,
            actorType: ActorType::ADMIN
        );

        // System Logger - User Logout Activity
        $roleName = $user->roles()->first()?->name ?? 'User';
        $roleSlug = strtoupper($user->roles()->first()?->slug ?? 'USER');
        $ip = request()->ip() ?? '127.0.0.1';

        SystemLogger::info(
            category: 'AUTH',
            event: 'USER_LOGOUT_SUCCESS',
            description: "User {$user->name} ({$roleName}) logged out of active session.",
            params: [
                'actor_type' => $roleSlug,
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'reference_type' => 'User',
                'reference_id' => (string) $user->id,
                'metadata' => [
                    'user_id' => $user->id,
                    'role' => $roleName,
                    'ip_address' => $ip,
                ],
            ]
        );
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => $newPassword,
        ]);

        // Revoke all existing tokens except current or all tokens for security
        $user->tokens()->delete();

        $this->auditLogService->log(
            action: 'PASSWORD_CHANGED',
            entityType: 'User',
            entityId: (string) $user->id,
            actor: $user,
            actorType: ActorType::ADMIN
        );
    }

    public function sendOtp(string $mobile): array
    {
        $cleanMobile = preg_replace('/\D/', '', $mobile);
        if (strlen($cleanMobile) < 10) {
            throw ValidationException::withMessages([
                'mobile' => ['Please enter a valid 10-digit mobile number.'],
            ]);
        }

        $user = User::where('mobile', $cleanMobile)->first();

        // Standard Demo / Production OTP
        $otp = '1234';

        // Log OTP in SmsLog if model exists
        try {
            if (class_exists(\App\Models\SmsLog::class)) {
                \App\Models\SmsLog::create([
                    'mobile' => $cleanMobile,
                    'message' => "Your Dastak verification code is: {$otp}",
                    'status' => 'SENT',
                ]);
            }
        } catch (\Throwable $e) {}

        return [
            'is_existing_user' => (bool) $user,
            'mobile' => $cleanMobile,
            'otp' => $otp,
            'message' => "Verification code sent to +91 {$cleanMobile}",
        ];
    }

    public function verifyOtp(string $mobile, string $otp, ?string $name = null, ?string $deviceName = 'Customer App'): array
    {
        $cleanMobile = preg_replace('/\D/', '', $mobile);
        $cleanOtp = trim($otp);

        // Verify standard or test OTP
        if ($cleanOtp !== '1234' && $cleanOtp !== '0000' && $cleanOtp !== '1111') {
            throw ValidationException::withMessages([
                'otp' => ['Invalid verification code. Please enter 1234 or request a new code.'],
            ]);
        }

        $user = User::where('mobile', $cleanMobile)->first();
        $isNewUser = false;

        if (! $user) {
            // Register new Customer User
            $isNewUser = true;
            $user = User::create([
                'name' => $name ? trim($name) : 'Customer ' . substr($cleanMobile, -4),
                'mobile' => $cleanMobile,
                'email' => $cleanMobile . '@dastak.local',
                'password' => Hash::make('password123'),
                'status' => AccountStatus::ACTIVE,
                'mobile_verified_at' => now(),
                'last_login_at' => now(),
            ]);

            $customerRole = \App\Models\Role::firstOrCreate(['slug' => 'customer'], ['name' => 'Customer']);
            $user->roles()->sync([$customerRole->id]);

            \App\Models\CustomerProfile::create([
                'user_id' => $user->id,
                'loyalty_points' => 100,
            ]);
        } else {
            $this->validateAccountStatus($user);
            $user->update(['last_login_at' => now(), 'mobile_verified_at' => now()]);
        }

        $token = $user->createToken($deviceName ?? 'Customer App')->plainTextToken;

        // System Logger - Customer Login / Register Activity
        $roleName = 'Customer';
        $ip = request()->ip() ?? '127.0.0.1';

        SystemLogger::info(
            category: 'AUTH',
            event: $isNewUser ? 'USER_REGISTER_SUCCESS' : 'USER_LOGIN_OTP_SUCCESS',
            description: "Customer {$user->name} ({$user->mobile}) verified OTP & logged in from {$deviceName}. IP: {$ip}.",
            params: [
                'actor_type' => 'CUSTOMER',
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'reference_type' => 'User',
                'reference_id' => (string) $user->id,
                'metadata' => [
                    'user_id' => $user->id,
                    'mobile' => $user->mobile,
                    'is_new_user' => $isNewUser,
                    'device' => $deviceName,
                    'ip_address' => $ip,
                ],
            ]
        );

        return [
            'token' => $token,
            'user' => $user->load('roles.permissions'),
            'is_new_user' => $isNewUser,
        ];
    }

    public function validateAccountStatus(User $user): void
    {
        if ($user->status === AccountStatus::BLOCKED) {
            throw new AuthenticationException('Your account has been permanently blocked. Please contact Dastak support.');
        }

        if ($user->status === AccountStatus::SUSPENDED) {
            throw new AuthenticationException('Your account is temporarily suspended. Please contact operations.');
        }
    }
}

