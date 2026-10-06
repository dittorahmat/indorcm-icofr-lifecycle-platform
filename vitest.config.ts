import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
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
