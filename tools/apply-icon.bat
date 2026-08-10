@echo off
setlocal
rem ============================================================
rem  Embed icon and version info into EXE using rcedit
rem  Usage: apply-icon.bat [exe-path]
rem  This file MUST stay ASCII (GBK-safe).
rem ============================================================

set "RCEDIT=%~dp0winCodeSign\win32\rcedit-x64.exe"
set "EXE=%~1"

if "%EXE%"=="" (
    set "EXE=%~dp0..\release\win-unpacked\ClaudeCode Hub.exe"
)

if not exist "%RCEDIT%" (
    echo [ERROR] rcedit not found. Run prepare-tools first.
    exit /b 1
)

if not exist "%EXE%" (
    echo [ERROR] EXE not found: %EXE%
    exit /b 1
)

echo Embedding icon and version info...

set "VER="
for /f "tokens=2 delims=:," %%a in ('findstr /C:"version" "%~dp0..\package.json"') do set "VER=%%~a"
set "VER=%VER:"=%"
set "VER=%VER: =%"

"%RCEDIT%" "%EXE%" ^
    --set-icon "%~dp0..\resources\icon.ico" ^
    --set-version-string "ProductName" "ClaudeCode Hub" ^
    --set-version-string "FileDescription" "ClaudeCode Hub - Claude Code conversation manager" ^
    --set-version-string "CompanyName" "dboycht" ^
    --set-version-string "LegalCopyright" "Copyright (c) 2026 dboycht" ^
    --set-file-version "%VER%" ^
    --set-product-version "%VER%"

if %errorlevel% equ 0 (
    echo [OK] Icon and version embedded
) else (
    echo [ERROR] rcedit failed
    exit /b 1
)
endlocal
exit /b 0