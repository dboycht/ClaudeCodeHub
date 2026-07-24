@echo off
chcp 65001 >nul
title Claude Code Manager - Dev Mode

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

:: Clear problematic env var
set ELECTRON_RUN_AS_NODE=

echo Starting Claude Code Manager in DEVELOPMENT mode...
echo HMR enabled - changes will auto-reload
echo.

npx vite
pause
