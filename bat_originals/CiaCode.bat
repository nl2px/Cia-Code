@echo off
setlocal enabledelayedexpansion
title Cia Code - Launcher
color 0B
cls
set "_DIR=%~dp0"
cd /d "!_DIR!"

echo.
echo  ============================================================
echo   C I A   C O D E   v1.0  -  INFORMATION IS POWER
echo  ============================================================
echo.

echo  [*] Dossier : !_DIR!
echo.

:: ── Verifier Node.js ────────────────────────────────────────────────────────
echo  [1/5] Verification Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Node.js non installe !
    start "" "https://nodejs.org/en/download"
    echo  Installe Node.js puis relance CiaCode.bat
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo  [OK] Node.js %%v

:: ── Installer les dependances si besoin ─────────────────────────────────────
echo  [2/5] Verification des dependances...
if not exist "!_DIR!node_modules\electron" (
    echo  [*] Installation en cours, veuillez patienter...
    call npm install
    if !errorlevel! neq 0 (
        echo  [ERREUR] npm install a echoue.
        pause
        exit /b 1
    )
    echo  [OK] Dependances installees
) else (
    echo  [OK] Dependances presentes
)

:: ── Ouvrir les liens ─────────────────────────────────────────────────────────
echo  [3/5] Ouverture des liens CIA...
start "" "https://discord.gg/YkbkwzUA49"
timeout /t 1 /nobreak >nul
start "" "https://guns.lol/nl2px"

:: ── Lancer React ─────────────────────────────────────────────────────────────
echo  [4/5] Demarrage du serveur React (port 3002)...
start "CIA-React-Server" /min cmd /c "cd /d "!_DIR!" && npm run react-start"

:: ── Attendre React ───────────────────────────────────────────────────────────
echo  [*] Attente du serveur React
set /a tries=0
:wait_loop
    set /a tries+=1
    if !tries! gtr 30 (
        echo.
        echo  [ERREUR] React n'a pas demarre. Verifiez la fenetre CIA-React-Server.
        pause
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    powershell -Command "try{(New-Object Net.WebClient).DownloadString('http://localhost:3002')|Out-Null;exit 0}catch{exit 1}" >nul 2>&1
    if !errorlevel! neq 0 (
        <nul set /p "=."
        goto wait_loop
    )
echo.
echo  [OK] React pret !

:: ── Lancer Electron ──────────────────────────────────────────────────────────
echo  [5/5] Lancement de Cia Code...
echo.
echo  ============================================================
echo   Ne fermez pas cette fenetre.
echo  ============================================================
echo.

"!_DIR!node_modules\.bin\electron.cmd" .

echo.
echo  [OK] Cia Code ferme.
timeout /t 3 /nobreak >nul
exit /b 0
endlocal
