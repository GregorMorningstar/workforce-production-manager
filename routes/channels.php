<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('chat', function ($user) {
    return ['id' => $user->id, 'name' => $user->name];
});

Broadcast::channel('performance.moderator', function ($user) {
    return (string) ($user->role?->value ?? '') === 'moderator';
});

Broadcast::channel('performance.user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('performance.department.{departmentId}', function ($user, $departmentId) {
    return (int) ($user->department_id ?? 0) === (int) $departmentId;
});
