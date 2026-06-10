import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@wiki/domain-models': path.resolve(
        __dirname,
        '../domain-models/src/index.ts'
      ),
      '@wiki/domain-naming': path.resolve(
        __dirname,
        '../domain-naming/src/index.ts'
      ),
      '@wiki/domain-validation': path.resolve(
        __dirname,
        '../domain-validation/src/index.ts'
      ),
      '@wiki/application-ports': path.resolve(
        __dirname,
        '../application-ports/src/index.ts'
      ),
      '@wiki/application-generators': path.resolve(
        __dirname,
        '../application-generators/src/index.ts'
      ),
      '@wiki/application-cross-reference': path.resolve(
        __dirname,
        '../application-cross-reference/src/index.ts'
      ),
      '@wiki/application-query': path.resolve(
        __dirname,
        '../application-query/src/index.ts'
      ),
      '@wiki/application-activity-log': path.resolve(
        __dirname,
        '../application-activity-log/src/index.ts'
      ),
      '@wiki/application-maintenance': path.resolve(
        __dirname,
        '../application-maintenance/src/index.ts'
      ),
      '@wiki/application-workflow': path.resolve(
        __dirname,
        '../application-workflow/src/index.ts'
      ),
      '@wiki/application-adr': path.resolve(
        __dirname,
        '../application-adr/src/index.ts'
      ),
      '@wiki/infrastructure-filesystem': path.resolve(
        __dirname,
        '../infrastructure-filesystem/src/index.ts'
      ),
      '@wiki/infrastructure-markdown': path.resolve(
        __dirname,
        '../infrastructure-markdown/src/index.ts'
      ),
      '@wiki/infrastructure-frontmatter': path.resolve(
        __dirname,
        '../infrastructure-frontmatter/src/index.ts'
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
