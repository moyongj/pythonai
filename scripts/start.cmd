@echo off
echo Starting HTTP service on port 5000 for deploy...

REM Set port environment variable
set PORT=5000

REM Run the custom server
node dist/server.js

echo Server stopped.