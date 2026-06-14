<?php

namespace App\Repositories\Contracts;

use App\Models\Chat;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ChatRepositoryInterface
{
    public function paginateUsers(int $currentUserId, int $perPage = 15, array $filters = []): LengthAwarePaginator;

    public function paginateConversation(int $currentUserId, int $otherUserId, int $perPage = 30): LengthAwarePaginator;

    public function createMessage(int $senderId, int $receiverId, string $message): Chat;

    public function userExists(int $userId): bool;
}
