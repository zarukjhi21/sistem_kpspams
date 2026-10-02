<?php

declare(strict_types=1);

namespace App\Services\Notification;

use App\Models\User;

interface NotificationChannelInterface
{
    /**
     * Send notification to a given user.
     *
     * @param User $user
     * @param string $title
     * @param string $message
     * @param array $payload
     * @return bool
     */
    public function send(User $user, string $title, string $message, array $payload = []): bool;
}
