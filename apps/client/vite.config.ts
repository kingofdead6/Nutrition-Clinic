/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Follow the server's PORT from apps/server/.env so the proxy never drifts from it.
  const serverEnv = loadEnv(mode, fileURLToPath(new URL('../server', import.meta.url)), '');
  const apiTarget = env.DEV_API_PROXY_TARGET || `http://127.0.0.1:${serverEnv.PORT || 4000}`;

  return {
    plugins: [react()],
    // Code shared with the server (schemas, calculations). The server gets a generated JS
    // copy: run `npm run sync:shared` from the repo root after editing src/shared.
    resolve: {
      alias: { '@shared': fileURLToPath(new URL('./src/shared/index.ts', import.meta.url)) },
    },
    test: { include: ['src/**/*.test.ts'], environment: 'node' },
    server: {
      port: 5173,
      strictPort: true,
      // Same-origin in development: the browser talks to Vite, Vite forwards /api.
      proxy: { '/api': { target: apiTarget, changeOrigin: false } },
    },
    preview: { port: 4273 },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // Served from localhost / the desktop app's disk, never over a slow network: the
      // shared vendor chunk (React, zod, i18n, query, router) is fine above 500 kB.
      chunkSizeWarningLimit: 800,
    },
  };
});
