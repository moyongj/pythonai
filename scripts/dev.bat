@echo off
setlocal enabledelayedexpansion

set "PORT=5000"
set "DEPLOY_RUN_PORT=%PORT%"

echo Clearing port %DEPLOY_RUN_PORT% before start.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%DEPLOY_RUN_PORT%"') do (
    if not "%%a"=="0" (
        echo Killing process on port %DEPLOY_RUN_PORT% (PID: %%a)
        taskkill /f /pid %%a
    )
)

timeout /t 1 /nobreak >nul

echo Starting HTTP service on port %DEPLOY_RUN_PORT% for dev...

set "PORT=%DEPLOY_RUN_PORT%"
pnpm tsx watch src/server.ts

endlocal