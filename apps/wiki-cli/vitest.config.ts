import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@wiki/application-ports': path.resolve(
        __dirname,
        '../../libs/wiki/application-ports/src/index.ts'
      ),
      '@wiki/domain-models': path.resolve(
        __dirname,
        '../../libs/wiki/domain-models/src/index.ts'
      ),
      '@wiki/application-index-manager': path.resolve(
        __dirname,
        '../../libs/wiki/application-index-manager/src/index.ts'
      ),
      '@wiki/application-tag-validation': path.resolve(
        __dirname,
        '../../libs/wiki/application-tag-validation/src/index.ts'
      ),
      '@wiki/application-scaffolding': path.resolve(
        __dirname,
        '../../libs/wiki/application-scaffolding/src/index.ts'
      ),
      '@wiki/infrastructure-filesystem': path.resolve(
        __dirname,
        '../../libs/wiki/infrastructure-filesystem/src/index.ts'
      ),
      '@wiki/infrastructure-frontmatter': path.resolve(
        __dirname,
        '../../libs/wiki/infrastructure-frontmatter/src/index.ts'
      ),
      '@wiki/infrastructure-markdown': path.resolve(
        __dirname,
        '../../libs/wiki/infrastructure-markdown/src/index.ts'
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    root: __dirname,
    testTimeout: 30000,
  },
});
