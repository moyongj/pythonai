@echo off
echo Installing dependencies...
call pnpm install --prefer-frozen-lockfile --prefer-offline

echo Building the Next.js project...
call pnpm next build

echo Bundling server with tsup...
call pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

echo Build completed successfully!
pause
