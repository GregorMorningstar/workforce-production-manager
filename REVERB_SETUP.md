# Reverb Chat - Kompletna Konfiguracja i Debug

## ✅ NAPRAWIONE PROBLEMY

### 1. Broadcasting Routes (KRYTYCZNE!)
**Problem:** Brak `Broadcast::routes()` uniemożliwiał autoryzację prywatnych kanałów
**Rozwiązanie:** Dodano w `routes/web.php`:
```php
use Illuminate\Support\Facades\Broadcast;
Broadcast::routes(['middleware' => ['web', 'auth']]);
```

### 2. Broadcasting Config
**Problem:** `config/broadcasting.php` używał `BROADCAST_DRIVER` zamiast `BROADCAST_CONNECTION`
**Rozwiązanie:** Zmieniono na:
```php
'default' => env('BROADCAST_CONNECTION', env('BROADCAST_DRIVER', 'null')),
```

### 3. Echo Authorization
**Problem:** Brak CSRF tokenu w requestach autoryzacyjnych
**Rozwiązanie:** Dodano w `resources/js/lib/echo.ts`:
```typescript
authEndpoint: '/broadcasting/auth',
auth: {
    headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    },
},
```

### 4. Event Listener
**Problem:** Słuchano `.MessageSent` zamiast `MessageSent`
**Rozwiązanie:** Zmieniono w `index.tsx`:
```typescript
.listen('MessageSent', (e: any) => {
```

### 5. Services
**Problem:** Reverb i Queue Worker nie były uruchomione
**Rozwiązanie:** Utworzono `start-services.bat` do automatycznego uruchamiania

## 📋 AKTUALNA KONFIGURACJA

### .env
```
BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database

REVERB_APP_ID=888209
REVERB_APP_KEY=4akxwi52gk82au67oqza
REVERB_APP_SECRET=rhr803aq1yhrxruh841g
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### Channels Authorization (routes/channels.php)
```php
Broadcast::channel('chat.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('chat', function ($user) {
    return ['id' => $user->id, 'name' => $user->name];
});
```

### MessageSent Event
```php
public function broadcastOn(): array
{
    return [
        new PrivateChannel('chat.' . $this->chatMessage->receiver_id),
    ];
}
// broadcastAs() USUNIĘTE - używamy domyślnej nazwy 'MessageSent'
```

## 🔧 KROKI DEBUGOWANIA

### 1. Sprawdź czy usługi działają
```powershell
# Sprawdź Reverb (port 8080)
Get-NetTCPConnection -LocalPort 8080

# Sprawdź procesy PHP
Get-Process php
```

### 2. Sprawdź logi
```powershell
# Laravel logs
Get-Content storage\logs\laravel.log -Tail 50

# Reverb debug (uruchom w osobnym oknie)
php artisan reverb:start --debug

# Queue worker (uruchom w osobnym oknie)
php artisan queue:work --verbose
```

### 3. Testuj w przeglądarce
```javascript
// W konsoli przeglądarki:
console.log('Echo:', window.Echo);
console.log('Channels:', Object.keys(window.Echo.connector.channels));
console.log('Connection:', window.Echo.connector.pusher.connection.state);

// Powinno być:
// - Echo: obiekt Echo
// - Channels: ['private-chat.1', 'private-chat.2', 'presence-chat']
// - Connection: "connected"
```

### 4. Sprawdź autoryzację kanałów
```javascript
// W konsoli, gdy jesteś na stronie chat:
window.Echo.connector.channels['private-chat.1'] // lub twój user_id
// Powinno zwrócić obiekt z właściwością 'callbacks'
```

### 5. Test prostego broadcastu
```php
// W tinker (php artisan tinker):
$user1 = User::find(1);
$user2 = User::find(2);
$chat = Chat::create([
    'sender_id' => $user1->id,
    'receiver_id' => $user2->id,
    'message' => 'Test message'
]);
broadcast(new \App\Events\MessageSent($chat));
```

## 🚀 URUCHOMIENIE

### Automatyczne (zalecane)
```cmd
start-services.bat
```

### Manualne
1. Terminal 1 - Reverb:
```bash
php artisan reverb:start --debug
```

2. Terminal 2 - Queue Worker:
```bash
php artisan queue:work --verbose
```

3. Terminal 3 - Vite:
```bash
npm run dev
```

4. Terminal 4 - Laravel:
```bash
php artisan serve
```

## 🧪 WERYFIKACJA DZIAŁANIA

1. **Otwórz dwie przeglądarki/karty**
   - Przeglądarka 1: zaloguj jako User 1
   - Przeglądarka 2: zaloguj jako User 2

2. **Przejdź do /chat**
   - W obu przeglądarkach

3. **Sprawdź Console**
   - Powinieneś zobaczyć:
     - `=== ECHO DEBUG ===` z wartościami env
     - `🔌 Echo instance:` z obiektem Echo
     - `📡 [Echo] Subskrypcja kanału prywatnego: chat.X`
     - `📡 [Echo] Connection state: connected`

4. **Wyślij wiadomość**
   - W Przeglądarce 1 wyślij wiadomość do User 2
   - Powinieneś zobaczyć w console:
     - `📤 Wysyłam wiadomość:`
     - `✅ Wiadomość utworzona:`
   - W Przeglądarce 2 (User 2) powinieneś NATYCHMIAST zobaczyć:
     - `✅ [MessageSent] Odebrano wiadomość!`
     - Wiadomość pojawi się w UI **bez odświeżania**

## ❗ TYPOWE PROBLEMY

### Wiadomości nie pojawiają się na żywo
- ✅ Sprawdź czy Reverb działa (port 8080)
- ✅ Sprawdź czy queue:work działa
- ✅ Sprawdź connection.state (powinno być "connected")
- ✅ Sprawdź czy channels są zarejestrowane
- ✅ Sprawdź logi Laravel i Reverb

### "403 Forbidden" przy subskrypcji
- ✅ Upewnij się że `Broadcast::routes()` jest w web.php
- ✅ Sprawdź czy user jest zalogowany
- ✅ Sprawdź autoryzację w routes/channels.php
- ✅ Sprawdź czy CSRF token jest w headers

### "Connection refused"
- ✅ Uruchom `php artisan reverb:start`
- ✅ Sprawdź czy port 8080 jest wolny
- ✅ Sprawdź .env - REVERB_HOST i REVERB_PORT

### События не broadcastują
- ✅ Sprawdź czy implements ShouldBroadcast
- ✅ Sprawdź BROADCAST_CONNECTION=reverb w .env
- ✅ Uruchom queue:work
- ✅ Sprawdź logi: storage/logs/laravel.log

## 📝 PLIKI DO SPRAWDZENIA

Po wszystkich zmianach, upewnij się że:

1. ✅ `routes/web.php` - zawiera `Broadcast::routes()`
2. ✅ `routes/channels.php` - autoryzacja chat.{userId}
3. ✅ `config/broadcasting.php` - BROADCAST_CONNECTION
4. ✅ `app/Events/MessageSent.php` - bez broadcastAs()
5. ✅ `resources/js/lib/echo.ts` - authEndpoint i CSRF header
6. ✅ `resources/js/pages/chat/index.tsx` - listen('MessageSent')
7. ✅ `.env` - wszystkie REVERB_* zmienne
8. ✅ `resources/views/app.blade.php` - meta csrf-token

## 🎯 NASTĘPNE KROKI

Jeśli nadal nie działa:

1. Zrestartuj wszystkie usługi:
```bash
php artisan config:clear
php artisan cache:clear
php artisan queue:restart
# Zatrzymaj Reverb (Ctrl+C) i uruchom ponownie
php artisan reverb:start --debug
```

2. Przebuduj frontend:
```bash
npm run build
# lub w trybie dev:
npm run dev
```

3. Sprawdź Network tab w Chrome DevTools:
   - Powinien być WebSocket connection do ws://localhost:8080
   - Status: 101 Switching Protocols
   - Messages: powinny być widoczne broadcast events

4. Otwórz reverb-test.html:
   - http://localhost:8000/reverb-test.html
   - Sprawdź czy połączenie działa bez Laravel Echo
