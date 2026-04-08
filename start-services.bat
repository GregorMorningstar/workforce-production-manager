@echo off
echo Starting Laravel Reverb and Queue Worker...
echo.
echo Starting Reverb in new window...
start "Laravel Reverb" cmd /k "cd /d %~dp0 && php artisan reverb:start --debug"
timeout /t 3
echo Starting Queue Worker in new window...
start "Laravel Queue Worker" cmd /k "cd /d %~dp0 && php artisan queue:work --verbose"
echo.
echo Services started!
echo - Reverb: Check "Laravel Reverb" window
echo - Queue Worker: Check "Laravel Queue Worker" window
echo.
pause
