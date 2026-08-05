@echo off
setlocal enabledelayedexpansion
title Cia Code
set "_DIR=%~dp0"
cd /d "!_DIR!"

echo Demarrage React...
start "React" /min cmd /c "cd /d "!_DIR!" && npm run react-start"

echo Attente 25 secondes pour React...
timeout /t 25 /nobreak

echo Lancement Electron...
"!_DIR!node_modules\.bin\electron.cmd" .

pause
endlocal
