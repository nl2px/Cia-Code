@echo off
setlocal enabledelayedexpansion
title Cia Code
set "_DIR=%~dp0"
cd /d "!_DIR!"

echo Demarrage React...
start "React" /min cmd /c "cd /d "!_DIR!" && npm run react-start"

echo Attente 15 secondes...
timeout /t 15 /nobreak

echo Ouverture des liens...
start "" "https://discord.gg/YkbkwzUA49"
start "" "https://guns.lol/nl2px"

echo Lancement Electron...
"!_DIR!node_modules\.bin\electron.cmd" .

pause
endlocal
