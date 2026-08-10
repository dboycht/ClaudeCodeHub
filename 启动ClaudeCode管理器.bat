@echo off
title Claude Code Manager

echo =====================================================
echo        Claude Code Manager - Launching...
echo =====================================================
echo.

:: Detect script location
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    echo         Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version

:: Check if electron is installed
if not exist "%APP_DIR%node_modules\electron\dist\electron.exe" (
    echo [ERROR] Electron not found. Please run 'npm install' first.
    pause
    exit /b 1
)

:: IMPORTANT: Clear ELECTRON_RUN_AS_NODE env var
:: This env var forces Electron to run as plain Node.js, which breaks Electron.
if defined ELECTRON_RUN_AS_NODE (
    echo [WARN] ELECTRON_RUN_AS_NODE is set, unsetting it...
    set ELECTRON_RUN_AS_NODE=
)

echo [INFO] Starting Electron application...
echo [INFO] Window will appear shortly...
echo.

:: Launch with the local electron binary to avoid npx resolution issues
start "" "%APP_DIR%node_modules\electron\dist\electron.exe" "%APP_DIR%."

echo [INFO] Application launched successfully!
echo [INFO] You can close this terminal window.

:: Wait briefly so user can see messages, then auto-close
timeout /t 2 >nul
exit /b 0
