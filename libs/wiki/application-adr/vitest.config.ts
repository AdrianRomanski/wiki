import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@wiki/application-ports': path.resolve(
        __dirname,
        '../application-ports/src/index.ts'
      ),
      '@wiki/domain-models': path.resolve(
        __dirname,
        '../domain-models/src/index.ts'
      ),
      '@wiki/domain-naming': path.resolve(
        __dirname,
        '../domain-naming/src/index.ts'
      ),
      '@wiki/application-generators': path.resolve(
        __dirname,
        '../application-generators/src/index.ts'
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
  },
});
