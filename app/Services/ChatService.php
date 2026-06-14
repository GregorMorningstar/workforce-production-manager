<?php

namespace App\Services;

use App\Models\Chat;
use App\Repositories\Contracts\ChatRepositoryInterface;
use App\Services\Contracts\ChatServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ChatService implements ChatServiceInterface
{
    public function __construct(private readonly ChatRepositoryInterface $repo)
    {
    }

    public function paginateUsers(int $currentUserId, int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->repo->paginateUsers($currentUserId, $perPage, $filters);
    }

    public function paginateConversation(int $currentUserId, int $otherUserId, int $perPage = 30): LengthAwarePaginator
    {
        return $this->repo->paginateConversation($currentUserId, $otherUserId, $perPage);
    }

    public function createMessage(int $senderId, int $receiverId, string $message): Chat
    {
        return $this->repo->createMessage($senderId, $receiverId, $message);
    }

    public function userExists(int $userId): bool
    {
        return $this->repo->userExists($userId);
    }
}
