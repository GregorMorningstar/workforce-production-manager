<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\User;
use Inertia\Inertia;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function index(Request $request)
    {
       $user_id = Auth::id();
       $other_user_id = $request->integer('other_user_id');
       $users = User::select('id','name','email')->with('profile')->orderBy('name')->get();

       $chats = [];
       if ($other_user_id) {
           $chats = Chat::where(function ($query) use ($user_id, $other_user_id) {
                $query->where('sender_id', $user_id)
                      ->where('receiver_id', $other_user_id);
            })->orWhere(function ($query) use ($user_id, $other_user_id) {
                $query->where('sender_id', $other_user_id)
                      ->where('receiver_id', $user_id);
            })
            ->orderBy('created_at')
            ->get();
       }

       \Log::info('Chat index', [
           'user_id' => $user_id,
           'other_user_id' => $other_user_id,
           'chats_count' => count($chats)
       ]);

       // Return JSON if request wants JSON (AJAX requests)
       if ($request->wantsJson() || $request->ajax()) {
           return response()->json([
               'chats' => $chats,
               'other_user_id' => $other_user_id,
               'user_id' => $user_id,
           ]);
       }

       return Inertia::render('chat/index', [
           'chats' => $chats,
           'other_user_id' => $other_user_id,
           'user_id' => $user_id,
           'users' => $users
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

            $chat = Chat::create([
                'sender_id' => Auth::id(),
                'receiver_id' => $validated['other_user_id'],
                'message' => $validated['message'],
            ]);

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
