import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  minify: false,
  splitting: false,
  // 排除 next 和相关依赖，它们会在运行时从 node_modules 加载
  external: [
    'next',
    'react',
    'react-dom',
    '@next/env',
  ],
});