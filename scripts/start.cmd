@echo off
echo Starting the Next.js production server...

REM Start the server in the background
start "Next.js Server" cmd /c "node_modules\.bin\next start"

echo Server started! Please check the new window for server status.
pause
