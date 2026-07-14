import { defineConfig } from 'vitest/config';

/**
 * The examples library contains only runnable example/script files
 * (no *.spec.ts files exist). This config exists so the `test` target
 * has a valid entry point; `passWithNoTests` prevents a false failure
 * when zero test files are found.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    root: __dirname,
    passWithNoTests: true,
  },
});
