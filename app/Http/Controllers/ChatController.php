<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Services\Contracts\ChatServiceInterface;

class ChatController extends Controller
{
    public function __construct(private readonly ChatServiceInterface $chatService)
    {
    }

    public function index(Request $request)
    {
        $userId = (int) Auth::id();
        $search = trim((string) $request->query('search', ''));
        $usersPerPage = max(5, min(50, $request->integer('users_per_page', 12)));
        $messagesPerPage = max(10, min(100, $request->integer('messages_per_page', 30)));

        $users = $this->chatService->paginateUsers($userId, $usersPerPage, [
            'search' => $search,
        ]);

        $otherUserId = $request->integer('other_user_id');
        if ($otherUserId !== null && $otherUserId > 0) {
            if ($otherUserId === $userId || !$this->chatService->userExists($otherUserId)) {
                $otherUserId = null;
            }
        } else {
            $otherUserId = null;
        }

        $chats = null;
        if ($otherUserId !== null) {
            $chats = $this->chatService->paginateConversation($userId, $otherUserId, $messagesPerPage);
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'chats' => $chats,
                'other_user_id' => $otherUserId,
                'user_id' => $userId,
                'users' => $users,
                'filters' => [
                    'search' => $search,
                ],
            ]);
        }

        return Inertia::render('chat/index', [
            'chats' => $chats,
            'other_user_id' => $otherUserId,
            'user_id' => $userId,
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        \Log::info('Chat store - START', [
            'user_id' => Auth::id(),
            'data' => $request->all()
        ]);

        try {
            $validated = $request->validate([
                'other_user_id' => 'required|exists:users,id',
                'message' => 'required|string|max:1000',
            ]);

            if ((int) $validated['other_user_id'] === (int) Auth::id()) {
                return response()->json(['error' => 'Nie można wysłać wiadomości do siebie.'], 422);
            }

            $chat = $this->chatService->createMessage(
                (int) Auth::id(),
                (int) $validated['other_user_id'],
                (string) $validated['message'],
            );

            \Log::info('Chat store - SUCCESS', ['chat_id' => $chat->id]);

            // Broadcast event do odbiorcy
            \Log::info('Broadcasting MessageSent event', [
                'chat_id' => $chat->id,
                'receiver_id' => $chat->receiver_id
            ]);

            broadcast(new MessageSent($chat));

            return response()->json($chat, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Chat store - VALIDATION ERROR', ['errors' => $e->errors()]);
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Chat store - ERROR: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
