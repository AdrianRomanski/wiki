/**
 * Vitest configuration for research workflow tests
 * Feature: polished-research-workflow
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/types/**',
        '**/errors/**'
      ]
    },
    // Property-based testing configuration
    testTimeout: 30000, // Increased timeout for property tests
  }
});
