import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Follow the server's PORT from apps/server/.env so the proxy never drifts from it.
  const serverEnv = loadEnv(mode, fileURLToPath(new URL('../server', import.meta.url)), '');
  const apiTarget = env.DEV_API_PROXY_TARGET || `http://127.0.0.1:${serverEnv.PORT || 4000}`;

  return {
    plugins: [react()],
    // Use @clinic/shared's TypeScript source directly (its "source" export), so shared
    // edits hot-reload without waiting for the package build.
    resolve: { conditions: ['source', ...defaultClientConditions] },
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
