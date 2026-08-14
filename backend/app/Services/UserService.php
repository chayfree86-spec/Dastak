<?php

namespace App\Services;

use App\Enums\AccountStatus;
use App\Enums\ActorType;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class UserService
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    public function listUsers(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::with(['roles', 'customerProfile', 'deliveryProfile']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['role'])) {
            $role = $filters['role'];
            $query->whereHas('roles', fn ($q) => $q->where('slug', $role));
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function getUserDetails(int $id): User
    {
        return User::with(['roles.permissions', 'customerProfile', 'addresses', 'deliveryProfile'])
            ->findOrFail($id);
    }

    public function updateUserStatus(User $user, AccountStatus $newStatus, ?string $reason = null): User
    {
        $oldStatus = $user->status->value;

        $user->update(['status' => $newStatus]);

        // If user is blocked or suspended, revoke all active tokens immediately
        if ($newStatus === AccountStatus::BLOCKED || $newStatus === AccountStatus::SUSPENDED) {
            $user->tokens()->delete();
        }

        $this->auditLogService->log(
            action: 'USER_STATUS_UPDATED',
            entityType: 'User',
            entityId: (string) $user->id,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => $newStatus->value, 'reason' => $reason],
            actorType: ActorType::ADMIN
        );

        return $user->fresh(['roles']);
    }

    public function assignRoles(User $user, array $roleSlugs): User
    {
        $oldRoles = $user->roles->pluck('slug')->toArray();

        foreach ($roleSlugs as $slug) {
            $user->assignRole($slug);
        }

        $this->auditLogService->log(
            action: 'USER_ROLES_UPDATED',
            entityType: 'User',
            entityId: (string) $user->id,
            oldValues: ['roles' => $oldRoles],
            newValues: ['roles' => $roleSlugs],
            actorType: ActorType::ADMIN
        );

        return $user->fresh(['roles']);
    }
}
