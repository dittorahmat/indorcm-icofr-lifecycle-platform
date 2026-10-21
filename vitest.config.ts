import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // threads: the default forks pool hangs on Node 26 (tinypool worker
    // timeout, 0 tests collected). Threads is behavior-identical for jsdom.
    pool: 'threads',
    setupFiles: ['./src/test/setup.ts'],
    // The full suite mounts ~200 jsdom files in one run; the 5s default times
    // out integration-style tests that pass standalone (AIAnalyticsMockup,
    // useBPMEditor). Generous ceilings keep real failures visible without
    // retries masking them.
    testTimeout: 20_000,
    hookTimeout: 30_000,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-whitelabel/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest}.config.*'
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
    // Tech-debt gate: run with `vitest run --coverage` (requires @vitest/coverage-v8).
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        'shared/mock-data.ts',
        'src/test/setup.ts',
        '**/*.test.*',
        '**/__tests__/**',
      ],
      thresholds: {
        lines: 50,
        branches: 40,
        functions: 40,
        statements: 50,
      },
    },
  },
});
