<?php

declare(strict_types=1);

namespace App\Services\Notification;

use App\Models\Notification;
use App\Models\User;

class InAppChannel implements NotificationChannelInterface
{
    public function send(User $user, string $title, string $message, array $payload = []): bool
    {
        Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $payload['type'] ?? 'SYSTEM',
            'data_payload' => $payload,
            'is_read' => false,
            'created_at' => now(),
        ]);

        return true;
    }
}
