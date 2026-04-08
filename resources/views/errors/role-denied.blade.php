<!DOCTYPE html>
<html lang="pl" class="h-full">
<head>
    <meta charset="UTF-8">
    <title>Brak uprawnień</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    @vite('resources/js/app.tsx')
    <link rel="preconnect" href="https://fonts.bunny.net">
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            const total = {{ $seconds }};
            let left = total;
            const span = document.getElementById('seconds');
            const bar = document.getElementById('bar');
            const circle = document.getElementById('circle');
            const target = @json($targetUrl);

            const interval = setInterval(() => {
                left--;
                if (span) span.textContent = String(left);
                const ratio = (total - left) / total;
                if (bar) bar.style.width = (ratio * 100) + '%';
                if (circle) {
                    circle.style.strokeDashoffset = (1 - ratio) * 283;
                }
                if (left <= 0) {
                    clearInterval(interval);
                    window.location.replace(target);
                }
            }, 1000);
        });
    </script>
    <style>
        .countdown-circle {
            transform: rotate(-90deg);
            transform-origin: center;
        }
    </style>
</head>
<body class="h-full bg-slate-900 text-slate-100 flex items-center justify-center p-6">
    <div class="w-full max-w-md space-y-6">
        <div class="text-center space-y-3">
            <h1 class="text-2xl font-semibold">Brak uprawnień</h1>
            <p class="text-sm text-slate-400">
                Twoja rola: <span class="font-medium">{{ $currentRole ?? '—' }}</span><br>
                Wymagane: <span class="font-medium">{{ implode(', ', $requiredRoles) }}</span>
            </p>
            <p class="mt-2">
                Za <span id="seconds" class="font-mono text-lg">{{ $seconds }}</span> s zostaniesz przekierowany na dashboard.
            </p>
        </div>

        <div class="flex items-center justify-center">
            <svg width="140" height="140">
                <circle cx="70" cy="70" r="45" stroke="#1e293b" stroke-width="12" fill="none" />
                <circle
                    id="circle"
                    class="countdown-circle transition-all duration-1000 ease-linear"
                    cx="70" cy="70" r="45"
                    stroke="#10b981"
                    stroke-width="12"
                    stroke-linecap="round"
                    fill="none"
                    stroke-dasharray="283"
                    stroke-dashoffset="283" />
                <text x="70" y="75" text-anchor="middle" fill="#f1f5f9" font-size="18" font-family="monospace">{{ $seconds }}</text>
            </svg>
        </div>

        <div class="h-2 w-full bg-slate-700 rounded overflow-hidden">
            <div id="bar" class="h-full bg-emerald-500 transition-all duration-1000 ease-linear" style="width:0%"></div>
        </div>

        <div class="flex gap-3 justify-center">
            <a href="{{ $targetUrl }}"
               class="px-4 py-2 text-sm rounded bg-emerald-600 hover:bg-emerald-500 transition">
                Przejdź teraz
            </a>
            <a href="{{ route('logout') }}"
               onclick="event.preventDefault(); document.getElementById('logout-form').submit();"
               class="px-4 py-2 text-sm rounded bg-slate-700 hover:bg-slate-600 transition">
                Wyloguj
            </a>
            <form id="logout-form" method="POST" action="{{ route('logout') }}" class="hidden">
                @csrf
            </form>
        </div>
    </div>
</body>
</html>