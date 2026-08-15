@echo off
title ClaudeCode Hub - 开发模式
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

:: 清除会导致 Electron 无法启动的环境变量
set ELECTRON_RUN_AS_NODE=

echo 正在以开发模式启动（支持热重载）...
npx vite
pause
