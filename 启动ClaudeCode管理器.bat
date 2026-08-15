@echo off
title ClaudeCode Hub 启动器
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

echo =====================================================
echo        ClaudeCode Hub  启动中...
echo =====================================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装。
    echo        下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查依赖，缺失则自动安装
if not exist "%APP_DIR%node_modules" (
    echo [提示] 未找到依赖，正在执行 npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] npm install 失败
        pause
        exit /b 1
    )
)

:: 检查编译产物，缺失则自动编译
if not exist "%APP_DIR%dist" (
    echo [提示] 未找到编译产物，正在构建...
    call npx vite build
    if %errorlevel% neq 0 (
        echo [错误] 构建失败
        pause
        exit /b 1
    )
)

:: 清除会导致 Electron 无法启动的环境变量
set ELECTRON_RUN_AS_NODE=

echo [提示] 正在启动应用，窗口即将出现...
start "" "%APP_DIR%node_modules\electron\dist\electron.exe" "%APP_DIR%."

timeout /t 2 >nul 2>&1
exit /b 0
