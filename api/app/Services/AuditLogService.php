<?php

namespace App\Services;

use App\Enums\ActorType;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    public function log(
        string $action,
        string $entityType,
        ?string $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?User $actor = null,
        ActorType $actorType = ActorType::SYSTEM
    ): AuditLog {
        $user = $actor ?? auth('sanctum')->user();

        return AuditLog::create([
            'user_id' => $user?->id,
            'actor_type' => $actorType->value,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId ? (string) $entityId : null,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => substr(Request::userAgent() ?? '', 0, 500),
            'created_at' => now(),
        ]);
    }
}
