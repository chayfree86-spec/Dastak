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
