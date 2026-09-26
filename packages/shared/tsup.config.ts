import { defineConfig } from 'tsup';

/**
 * Compiles the shared package to plain ESM JavaScript + .d.ts in dist/, which is what the
 * (JavaScript) server imports. The client resolves the "source" export condition and uses
 * src/ directly, so it needs no build step.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  dts: false, // declarations come from `tsc -p tsconfig.build.json` (tsup's dts step injects baseUrl, rejected by TS 6)
  clean: false,
  sourcemap: true,
});
