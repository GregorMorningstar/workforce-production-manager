# 🚀 Instrukcja uruchomienia chatu pod /chat

## ✅ Co zostało naprawione:

1. ✅ Dodano import `ChatController` w [routes/web.php](routes/web.php)
2. ✅ Uzupełniono model [Chat](app/Models/Chat.php) o `fillable`, `casts` i relacje
3. ✅ Utworzono event [MessageSent](app/Events/MessageSent.php) dla broadcasting
4. ✅ Uruchomiono migrację `create_chats_table`
5. ✅ Dodano [config/broadcasting.php](config/broadcasting.php)
6. ✅ Dodano [routes/channels.php](routes/channels.php) dla autoryzacji kanałów
7. ✅ Zaktualizowano [bootstrap/app.php](bootstrap/app.php) aby ładować channels
8. ✅ Utworzono placeholder [echo.ts](resources/js/lib/echo.ts)

## 🔧 Podstawowa funkcjonalność (BEZ real-time)

**Chat działa już teraz!** Możesz:
- Wybrać użytkownika z listy
- Wysłać wiadomość
- Odświeżyć stronę żeby zobaczyć nowe wiadomości

## 🌐 Uruchomienie funkcji real-time (opcjonalnie)

### Opcja 1: Laravel Reverb (POLECANE - darmowe)

1. Zainstaluj Reverb:
```powershell
composer require laravel/reverb
php artisan reverb:install
```

2. W pliku `.env` zmień:
```env
BROADCAST_CONNECTION=reverb
```

3. Uruchom Reverb server w osobnym terminalu:
```powershell
php artisan reverb:start
```

4. Zainstaluj pakiety JavaScript:
```powershell
npm install --save-dev laravel-echo pusher-js
```

5. Zaktualizuj `resources/js/lib/echo.ts`:
```typescript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});

if (typeof window !== 'undefined') {
    (window as any).Echo = echo;
}

export default echo;
```

6. Dodaj do `.env`:
```env
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### Opcja 2: Pusher (zewnętrzna usługa)

1. Zarejestruj się na https://pusher.com (darmowy plan)

2. Zainstaluj pusher dla PHP:
```powershell
composer require pusher/pusher-php-server
```

3. Zainstaluj pakiety JavaScript:
```powershell
npm install --save-dev laravel-echo pusher-js
```

4. W `.env` zmień:
```env
BROADCAST_CONNECTION=pusher

PUSHER_APP_ID=your-app-id
PUSHER_APP_KEY=your-app-key
PUSHER_APP_SECRET=your-app-secret
PUSHER_APP_CLUSTER=eu

VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

5. Zaktualizuj `resources/js/lib/echo.ts`:
```typescript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true
});

if (typeof window !== 'undefined') {
    (window as any).Echo = echo;
}

export default echo;
```

## 🏃 Uruchomienie aplikacji

1. Upewnij się że XAMPP MySQL jest uruchomiony

2. Uruchom serwer deweloperski:
```powershell
composer dev
```

LUB oddzielnie:
```powershell
# Terminal 1
php artisan serve

# Terminal 2  
npm run dev

# Terminal 3 (opcjonalnie dla queue)
php artisan queue:work

# Terminal 4 (opcjonalnie dla Reverb)
php artisan reverb:start
```

3. Otwórz przeglądarkę: http://localhost:8000/chat

## 🧪 Testowanie

1. Otwórz chat w dwóch różnych przeglądarkach/kartach
2. Zaloguj się jako różni użytkownicy
3. Wyślij wiadomość z jednej karty
4. Sprawdź czy pojawia się na drugiej (jeśli skonfigurowałeś real-time)

## 📝 Notatki

- Bez broadcasting wiadomości będą widoczne po odświeżeniu strony
- Z broadcasting (Reverb/Pusher) wiadomości pojawiają się natychmiast
- Pamiętaj aby uruchomić `php artisan queue:work` dla przetwarzania eventów
- Status online/offline wymaga presence channel (działa z Reverb/Pusher)

Powodzenia! 🎉
