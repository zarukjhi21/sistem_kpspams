<?php

declare(strict_types=1);

namespace App\Services\Notification;

use App\Models\User;

class NotificationService
{
    /**
     * @var array<string, NotificationChannelInterface>
     */
    protected array $channels = [];

    public function __construct()
    {
        // MVP: Registrasikan In-App Channel secara default
        $this->registerChannel('in_app', new InAppChannel());

        // WhatsApp Gateway dapat diregistrasikan di sini atau via ServiceProvider
        // tanpa mengubah satu baris pun logika bisnis billing/tagihan
        // Contoh masa depan:
        // if (config('services.whatsapp.enabled')) {
        //     $this->registerChannel('whatsapp', new WhatsAppChannel(config('services.whatsapp')));
        // }
    }

    public function registerChannel(string $name, NotificationChannelInterface $channel): void
    {
        $this->channels[$name] = $channel;
    }

    /**
     * Kirim notifikasi ke user melalui channel aktif.
     */
    public function notify(User $user, string $title, string $message, array $payload = [], array $targetChannels = ['in_app']): void
    {
        foreach ($targetChannels as $channelName) {
            if (isset($this->channels[$channelName])) {
                $this->channels[$channelName]->send($user, $title, $message, $payload);
            }
        }
    }
}
