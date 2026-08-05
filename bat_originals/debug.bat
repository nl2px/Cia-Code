@echo off
title DEBUG - Cia Code
color 0C
echo.
echo ===== DEBUG CIA CODE =====
echo.

echo [1] Verification Node.js...
where node
node -v
if %errorlevel% neq 0 (
    echo ERREUR: Node.js introuvable
    pause
    exit /b
)
echo OK

echo.
echo [2] Verification npm...
where npm
npm -v
echo OK

echo.
echo [3] Dossier actuel:
cd /d "%~dp0"
echo %cd%

echo.
echo [4] Verification node_modules...
if exist "node_modules" (
    echo node_modules: PRESENT
) else (
    echo node_modules: ABSENT - installation requise
)

echo.
echo [5] Verification electron...
if exist "node_modules\.bin\electron.cmd" (
    echo electron.cmd: PRESENT
) else (
    echo electron.cmd: ABSENT
)

echo.
echo [6] Verification node-pty...
if exist "node_modules\node-pty" (
    echo node-pty: PRESENT
) else (
    echo node-pty: ABSENT
)

echo.
echo [7] Test start.js...
if exist "start.js" (
    echo start.js: PRESENT
) else (
    echo start.js: ABSENT
)

echo.
echo ===========================
echo Appuyez sur une touche pour tester le lancement React...
pause

echo.
echo [8] Lancement React en test (Ctrl+C pour arreter)...
npm run react-start

pause
