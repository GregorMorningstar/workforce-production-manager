<?php

namespace App\Repositories\Eloquent;

use App\Models\Chat;
use App\Models\User;
use App\Repositories\Contracts\ChatRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentChatRepository implements ChatRepositoryInterface
{
    public function __construct(
        private readonly Chat $chatModel,
        private readonly User $userModel,
    ) {
    }

    public function paginateUsers(int $currentUserId, int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $search = trim((string) ($filters['search'] ?? ''));

        $query = $this->userModel
            ->newQuery()
            ->select('id', 'name', 'email')
            ->with('profile')
            ->where('id', '!=', $currentUserId)
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query
            ->paginate($perPage, ['*'], 'users_page')
            ->withQueryString();
    }

    public function paginateConversation(int $currentUserId, int $otherUserId, int $perPage = 30): LengthAwarePaginator
    {
        return $this->chatModel
            ->newQuery()
            ->where(function ($query) use ($currentUserId, $otherUserId) {
                $query->where('sender_id', $currentUserId)
                    ->where('receiver_id', $otherUserId);
            })
            ->orWhere(function ($query) use ($currentUserId, $otherUserId) {
                $query->where('sender_id', $otherUserId)
                    ->where('receiver_id', $currentUserId);
            })
            ->orderBy('created_at')
            ->paginate($perPage, ['*'], 'messages_page')
            ->withQueryString();
    }

    public function createMessage(int $senderId, int $receiverId, string $message): Chat
    {
        return $this->chatModel->create([
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'message' => $message,
        ]);
    }

    public function userExists(int $userId): bool
    {
        return $this->userModel->newQuery()->whereKey($userId)->exists();
    }
}
