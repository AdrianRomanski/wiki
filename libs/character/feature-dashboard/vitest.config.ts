import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@wiki/character-domain-models': path.resolve(
        __dirname,
        '../domain-models/src/index.ts'
      ),
      '@wiki/character-data-access': path.resolve(
        __dirname,
        '../data-access/src/index.ts'
      ),
      '@wiki/character-ui-sheet': path.resolve(
        __dirname,
        '../ui-sheet/src/index.ts'
      ),
      '@wiki/character-ui-auth': path.resolve(
        __dirname,
        '../ui-auth/src/index.ts'
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
