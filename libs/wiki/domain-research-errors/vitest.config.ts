import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@wiki/domain-research-errors': path.resolve(
        __dirname,
        './src/index.ts'
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    root: __dirname,
    testTimeout: 10000,
    passWithNoTests: true,
  },
});
