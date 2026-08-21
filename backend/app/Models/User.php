<?php

namespace App\Models;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'mobile',
        'status',
        'avatar',
        'password',
        'login_pin',
        'email_verified_at',
        'mobile_verified_at',
        'last_login_at',
        'metadata',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'mobile_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'login_pin' => 'hashed',
            'status' => AccountStatus::class,
            'metadata' => 'array',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function customerProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(CustomerProfile::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function cart(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Cart::class);
    }

    public function couponUsages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function deliveryProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(DeliveryBoyProfile::class);
    }

    public function customerOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function riderOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'delivery_boy_id');
    }

    public function restaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class, 'owner_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function deviceTokens(): HasMany
    {
        return $this->hasMany(UserDeviceToken::class);
    }

    public function smsLogs(): HasMany
    {
        return $this->hasMany(SmsLog::class);
    }

    public function riderLocations(): HasMany
    {
        return $this->hasMany(RiderLocation::class);
    }

    public function hasRole(string|array|UserRole $roles): bool
    {
        if ($roles instanceof UserRole) {
            $roles = [$roles->value];
        } elseif (is_string($roles)) {
            $roles = [$roles];
        }

        return $this->roles()->whereIn('slug', $roles)->exists();
    }

    public function hasPermission(string $permissionSlug): bool
    {
        // Super Admin has all permissions
        if ($this->hasRole(UserRole::SUPER_ADMIN)) {
            return true;
        }

        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permissionSlug) {
                $query->where('slug', $permissionSlug);
            })
            ->exists();
    }

    public function assignRole(string|Role|UserRole $role): void
    {
        if ($role instanceof UserRole) {
            $role = Role::firstOrCreate(['slug' => $role->value], ['name' => $role->label()]);
        } elseif (is_string($role)) {
            $role = Role::firstOrCreate(['slug' => $role], ['name' => ucfirst(str_replace('_', ' ', $role))]);
        }

        $this->roles()->syncWithoutDetaching([$role->id]);
    }

    public function isBlocked(): bool
    {
        return $this->status === AccountStatus::BLOCKED || $this->status === AccountStatus::SUSPENDED;
    }

    public function getPrimaryRoleSlug(): string
    {
        $primaryRole = $this->roles()->first();
        return $primaryRole ? $primaryRole->slug : 'customer';
    }

    public function getProfileCompletionPercentageAttribute(): int
    {
        $score = 0;
        if (!empty($this->name)) $score += 15;
        if (!empty($this->email)) $score += 15;
        if (!empty($this->mobile)) $score += 15;

        $profile = $this->customerProfile;
        if ($profile) {
            if (!empty($profile->gender)) $score += 10;
            if (!empty($profile->date_of_birth)) $score += 15;
            if (!empty($profile->anniversary_date)) $score += 10;
            if (!empty($profile->dietary_preference) || (!empty($profile->taste_preferences) && count($profile->taste_preferences) > 0)) {
                $score += 20;
            }
        }

        return min(100, $score);
    }
}
