# System Balansów Urlopowych

## Opis systemu

System automatycznego zarządzania balansami urlopowymi, który:
- Automatycznie tworzy nowe balansy urlopowe dla wszystkich użytkowników na koniec roku
- Oblicza dni urlopu na podstawie stażu pracy (20 dni dla < 5 lat, 26 dni dla ≥ 5 lat)
- Uruchamia się automatycznie 31 grudnia o 23:59

## Struktura tabeli `leave_balances`

| Kolumna | Typ | Opis |
|---------|-----|------|
| user_id | Foreign Key | Powiązanie z użytkownikiem |
| year | Integer | Rok kalendarzowy |
| leave_type | Enum | Typ urlopu (vacation, sick, personal) |
| entitlement_days | Integer | Przysługujące dni (20/26) |
| used_days | Integer | Wykorzystane dni |
| remaining_days | Integer | Pozostałe dni |
| seniority_years | Integer | Lata stażu pracy |
| employment_start_date | Date | Data rozpoczęcia pracy |

## Automatyczne generowanie na nowy rok

### Command artisan
```bash
# Generuje balansy dla aktualnego roku
php artisan leave:generate-yearly

# Generuje balansy dla konkretnego roku
php artisan leave:generate-yearly --year=2026

# Nadpisuje istniejące rekordy
php artisan leave:generate-yearly --year=2026 --force
```

### Scheduler
System automatycznie uruchamia command **31 grudnia o 23:59**, generując balansy na następny rok.

Sprawdź zaplanowane zadania:
```bash
php artisan schedule:list
```

### Uruchamianie schedulera
Aby scheduler działał na serwerze, musisz dodać do crona:
```bash
# Edytuj crontab
crontab -e

# Dodaj linię (zmień ścieżkę na swoją):
* * * * * cd /path/to/your/project && php artisan schedule:run >> /dev/null 2>&1
```

## Logika obliczania dni urlopu

1. **Staż pracy** - obliczany na podstawie:
   - `employment_start_date` (jeśli istnieje)
   - `user.created_at` (jako fallback)

2. **Przysługujące dni**:
   - **< 5 lat stażu**: 20 dni urlopu
   - **≥ 5 lat stażu**: 26 dni urlopu

## Integracja z systemem urlopów

- Przy tworzeniu użytkownika automatycznie tworzony jest balance na aktualny rok
- System kalendarza korzysta z `remaining_days` do walidacji wniosków
- Po zatwierdzeniu urlopu automatycznie odejmuje dni z `remaining_days`

## Przykład użycia w kodzie

```php
// Pobierz balance użytkownika na aktualny rok
$balance = LeaveBalance::where('user_id', auth()->id())
    ->where('year', date('Y'))
    ->where('leave_type', 'vacation')
    ->first();

// Sprawdź ile dni pozostało
$remainingDays = $balance->remaining_days;

// Po zatwierdzeniu urlopu
$balance->increment('used_days', $requestedDays);
$balance->decrement('remaining_days', $requestedDays);
```

## Testowanie

```bash
# Test generowania balansów
php artisan leave:generate-yearly --year=2026

# Sprawdź utworzone rekordy
php artisan tinker
>>> App\Models\LeaveBalance::where('year', 2026)->count()
>>> App\Models\LeaveBalance::with('user')->where('year', 2026)->get()
```
