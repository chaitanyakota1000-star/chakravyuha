@echo off
cd /d "%~dp0"
echo ========================================================
echo   Starting Mahabharat 2.0 Live Server on Port 8000...
echo ========================================================
echo.
start "" "http://localhost:8000/index.html"
python -m http.server 8000
pause
