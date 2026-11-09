@echo off
cd /d "%~dp0"
echo Delivery Receipt: http://127.0.0.1:4317
node scripts/server.mjs
pause
