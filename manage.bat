@echo off
setlocal enabledelayedexpansion
title ClaudeCode Hub 管理脚本
cd /d "%~dp0"

:menu
cls
echo ================================================================
echo        ClaudeCode Hub 管理脚本 v1.00.3
echo ================================================================
echo.
echo   [1] 编译生成 EXE（文件夹形式）
echo   [2] 打包便携版 zip
echo   [3] 生成 GitHub 源码文件夹
echo   [4] 一键构建（编译 + 打包 + GitHub）
echo.
echo   [5] 安装依赖（npm install）
echo.
echo   [6] 清理编译缓存（dist/）
echo   [7] 清理打包产物（release/）
echo   [8] 清理 GitHub 文件夹
echo   [9] 清理依赖（node_modules/）
echo   [0] 全部清理
echo.
echo   [Q] 退出
echo.
echo ================================================================
set "choice="
set /p choice=请输入选项:

if "%choice%"=="1" goto build
if "%choice%"=="2" goto pack
if "%choice%"=="3" goto github
if "%choice%"=="4" goto full
if "%choice%"=="5" goto install
if "%choice%"=="6" goto clean_dist
if "%choice%"=="7" goto clean_release
if "%choice%"=="8" goto clean_github
if "%choice%"=="9" goto clean_modules
if "%choice%"=="0" goto clean_all
if /I "%choice%"=="Q" goto quit
echo 无效选项，请重新输入
timeout /t 1 >nul
goto menu

:: ============================================================
:: [1] 编译生成 EXE
:: ============================================================
:build
echo.
if not exist "%~dp0node_modules" (
    echo [提示] 未找到依赖，正在执行 npm install...
    call npm install
    if errorlevel 1 (
        echo [错误] npm install 失败
        pause
        goto menu
    )
)

set "ELECTRON_RUN_AS_NODE="

echo [1/2] Vite 编译中...
call npx vite build
if errorlevel 1 (
    echo [错误] 编译失败
    pause
    goto menu
)

echo [2/2] 打包为文件夹形式 EXE，请耐心等待...
set "CSC_IDENTITY_AUTO_DISCOVERY=false"
call npx electron-builder --win --x64 --dir

call "%~dp0tools\apply-icon.bat" "%~dp0release\win-unpacked\ClaudeCode Hub.exe"

if exist "%~dp0release\win-unpacked\ClaudeCode Hub.exe" (
    echo.
    echo ================================================================
    echo 编译完成！
    echo EXE 位置: release\win-unpacked\ClaudeCode Hub.exe
    echo ================================================================
) else (
    echo [错误] 编译失败，请查看上方日志
)
echo.
pause
goto menu

:: ============================================================
:: [2] 打包便携版 zip
:: ============================================================
:pack
echo.
if not exist "%~dp0release\win-unpacked\ClaudeCode Hub.exe" (
    echo [错误] 未找到编译产物，请先执行 [1] 编译
    pause
    goto menu
)

for /f "tokens=2 delims=:," %%a in ('findstr /C:"\"version\"" "%~dp0package.json"') do set "ver=%%~a"
set "ver=%ver:"=%
set "ver=%ver: =%"
set "zipname=ClaudeCodeHub-Portable-v%ver%.zip"

echo 正在压缩，请稍候...
if exist "%~dp0release\%zipname%" del "%~dp0release\%zipname%" >nul 2>&1
powershell -Command "Compress-Archive -Path '%~dp0release\win-unpacked\*' -DestinationPath '%~dp0release\%zipname%' -Force"

if exist "%~dp0release\%zipname%" (
    echo.
    echo ================================================================
    echo 打包完成！
    echo 文件: release\%zipname%
    echo ================================================================
) else (
    echo [错误] 打包失败
)
echo.
pause
goto menu

:: ============================================================
:: [3] 生成 GitHub 源码文件夹
:: ============================================================
:github
echo.
echo 正在生成 GitHub 源码文件夹...
set "gh=%~dp0GitHub"
if exist "%gh%" (
    echo 删除旧的 GitHub 文件夹...
    rd /s /q "%gh%" 2>nul
)
mkdir "%gh%" 2>nul

echo 复制 src/ 与 resources/ ...
robocopy "%~dp0src" "%gh%\src" /E /NFL /NDL /NJH /NJS >nul 2>&1
robocopy "%~dp0resources" "%gh%\resources" /E /NFL /NDL /NJH /NJS >nul 2>&1
robocopy "%~dp0.vscode" "%gh%\.vscode" /E /NFL /NDL /NJH /NJS >nul 2>&1
robocopy "%~dp0tools" "%gh%\tools" /E /NFL /NDL /NJH /NJS /XF winCodeSign-2.6.0.7z >nul 2>&1

for %%f in (package.json package-lock.json tsconfig.json tsconfig.main.json vite.config.ts index.html README.md manage.bat) do (
    if exist "%~dp0%%f" copy /Y "%~dp0%%f" "%gh%\" >nul 2>&1
)
if exist "%~dp0启动ClaudeCode管理器.bat" copy /Y "%~dp0启动ClaudeCode管理器.bat" "%gh%\" >nul 2>&1
if exist "%~dp0开发模式.bat" copy /Y "%~dp0开发模式.bat" "%gh%\" >nul 2>&1

(
echo node_modules/
echo dist/
echo release/
echo .claude/
echo GitHub/
) > "%gh%\.gitignore"

echo.
echo 完成！GitHub 文件夹: %gh%
echo.
pause
goto menu

:: ============================================================
:: [4] 一键构建
:: ============================================================
:full
echo.
echo ===== 一键构建 =====
echo.

set "ELECTRON_RUN_AS_NODE="

echo [1/3] 编译中...
call npx vite build >nul 2>&1
if errorlevel 1 (
    echo [错误] Vite 编译失败
    pause
    goto menu
)
set "CSC_IDENTITY_AUTO_DISCOVERY=false"
call npx electron-builder --win --x64 --dir >nul 2>&1
call "%~dp0tools\apply-icon.bat" "%~dp0release\win-unpacked\ClaudeCode Hub.exe" >nul 2>&1
if not exist "%~dp0release\win-unpacked\ClaudeCode Hub.exe" (
    echo [错误] EXE 打包失败
    pause
    goto menu
)
echo   [OK] 编译完成

echo [2/3] 打包便携版...
for /f "tokens=2 delims=:," %%a in ('findstr /C:"\"version\"" "%~dp0package.json"') do set "ver=%%~a"
set "ver=%ver:"=%
set "ver=%ver: =%"
set "zipname=ClaudeCodeHub-Portable-v%ver%.zip"
powershell -Command "Compress-Archive -Path '%~dp0release\win-unpacked\*' -DestinationPath '%~dp0release\%zipname%' -Force" >nul 2>&1
echo   [OK] 打包完成

echo [3/3] 生成 GitHub 文件夹...
set "gh=%~dp0GitHub"
if exist "%gh%" rd /s /q "%gh%" 2>nul
mkdir "%gh%" 2>nul
robocopy "%~dp0src" "%gh%\src" /E /NFL /NDL /NJH /NJS >nul 2>&1
robocopy "%~dp0resources" "%gh%\resources" /E /NFL /NDL /NJH /NJS >nul 2>&1
robocopy "%~dp0.vscode" "%gh%\.vscode" /E /NFL /NDL /NJH /NJS >nul 2>&1
robocopy "%~dp0tools" "%gh%\tools" /E /NFL /NDL /NJH /NJS /XF winCodeSign-2.6.0.7z >nul 2>&1
for %%f in (package.json package-lock.json tsconfig.json tsconfig.main.json vite.config.ts index.html README.md manage.bat) do (
    if exist "%~dp0%%f" copy /Y "%~dp0%%f" "%gh%\" >nul 2>&1
)
(
echo node_modules/
echo dist/
echo release/
echo .claude/
echo GitHub/
) > "%gh%\.gitignore"
echo   [OK] GitHub 文件夹完成

echo.
echo ================================================================
echo 一键构建完成！
echo   release\win-unpacked\   - EXE 文件夹（直接运行）
echo   release\%zipname%       - 便携版压缩包
echo   GitHub\                  - 源码（可上传）
echo ================================================================
echo.
pause
goto menu

:: ============================================================
:: [5] 安装依赖
:: ============================================================
:install
echo.
echo 正在安装依赖...
call npm install
if errorlevel 1 (
    echo [错误] 安装失败
) else (
    echo 安装完成！
)
echo.
pause
goto menu

:: ============================================================
:: 清理功能
:: ============================================================
:clean_dist
echo.
if exist "%~dp0dist" (
    echo 正在删除 dist/ ...
    rd /s /q "%~dp0dist" 2>nul
    echo 已删除编译缓存
) else (
    echo dist/ 不存在，跳过
)
echo.
pause
goto menu

:clean_release
echo.
if exist "%~dp0release" (
    echo 正在删除 release/ ...
    rd /s /q "%~dp0release" 2>nul
    echo 已删除打包产物
) else (
    echo release/ 不存在，跳过
)
echo.
pause
goto menu

:clean_github
echo.
if exist "%~dp0GitHub" (
    echo 正在删除 GitHub/ ...
    rd /s /q "%~dp0GitHub" 2>nul
    echo 已删除 GitHub 文件夹
) else (
    echo GitHub/ 不存在，跳过
)
echo.
pause
goto menu

:clean_modules
echo.
if exist "%~dp0node_modules" (
    echo 正在删除 node_modules/，这可能需要一些时间...
    rd /s /q "%~dp0node_modules" 2>nul
    echo 已删除依赖
) else (
    echo node_modules/ 不存在，跳过
)
echo.
pause
goto menu

:clean_all
echo.
echo ===== 全部清理 =====
if exist "%~dp0dist" ( rd /s /q "%~dp0dist" 2>nul & echo   dist/ 已清理 ) else ( echo   dist/ 跳过 )
if exist "%~dp0release" ( rd /s /q "%~dp0release" 2>nul & echo   release/ 已清理 ) else ( echo   release/ 跳过 )
if exist "%~dp0GitHub" ( rd /s /q "%~dp0GitHub" 2>nul & echo   GitHub/ 已清理 ) else ( echo   GitHub/ 跳过 )
if exist "%~dp0node_modules" ( rd /s /q "%~dp0node_modules" 2>nul & echo   node_modules/ 已清理 ) else ( echo   node_modules/ 跳过 )
echo.
echo 清理完成！仅保留源码文件。
echo.
pause
goto menu

:quit
echo 再见！
exit /b 0
