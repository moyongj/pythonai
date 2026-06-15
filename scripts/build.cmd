@echo off
echo Installing dependencies...
call pnpm install --prefer-frozen-lockfile --prefer-offline

echo Building the Next.js project...
call pnpm exec next build

echo Bundling server with tsup...
call pnpm exec tsup

echo Build completed successfully!