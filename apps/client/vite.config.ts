/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The API address is a constant in src/lib/apiClient.ts (no .env needed).
export default defineConfig({
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
  },
  preview: { port: 4273 },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Served from localhost / the desktop app's disk, never over a slow network: the
    // shared vendor chunk (React, zod, i18n, query, router) is fine above 500 kB.
    chunkSizeWarningLimit: 800,
  },
});
